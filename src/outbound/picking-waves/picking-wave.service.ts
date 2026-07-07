import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PickingWaveService {
  private readonly logger = new Logger(PickingWaveService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a picking wave from selected sales orders.
   * Groups orders, validates they are in RELEASED status, and creates wave_orders links.
   */
  async deleteWave(tenantId: string, waveId: bigint) {
    const wave = await this.findWaveById(tenantId, waveId);
    await this.prisma.picking_waves.deleteMany({
      where: { tenant_id: tenantId, wave_id: waveId },
    });
    return wave;
  }

  async createWave(tenantId: string, dto: any) {
    const facilityId = BigInt(dto.facility_id);
    const orderIds = (dto.order_ids || []).map((id: string) => BigInt(id));

    if (!orderIds.length) throw new BadRequestException('At least one order ID required');

    // Validate orders exist and are in RELEASED status
    const orders = await this.prisma.sales_orders.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, order_id: { in: orderIds } },
    });

    const invalidOrders = orders.filter((o) => o.status !== 'RELEASED');
    if (invalidOrders.length) {
      throw new BadRequestException(
        `Orders ${invalidOrders.map((o) => o.order_number).join(', ')} are not in RELEASED status`,
      );
    }

    // Create wave
    const wave = await this.prisma.picking_waves.create({
      data: {
        tenant_id: tenantId,
        facility_id: facilityId,
        wave_number: dto.wave_number || `WAVE-${Date.now()}`,
        wave_name: dto.wave_name,
        description: dto.description,
        selection_criteria_json: dto.selection_criteria_json || JSON.stringify({ orderIds: orderIds.map((id) => id.toString()) }),
        scheduled_start_time: dto.scheduled_start_time ? new Date(dto.scheduled_start_time) : undefined,
        notes: dto.notes,
      },
    });

    // Link orders to wave
    for (const orderId of orderIds) {
      await this.prisma.wave_orders.create({
        data: {
          tenant_id: tenantId,
          facility_id: facilityId,
          wave_id: wave.wave_id,
          order_id: orderId,
        },
      });
      // Transition order to WAVED
      await this.prisma.sales_orders.updateMany({
        where: { tenant_id: tenantId, order_id: orderId },
        data: { status: 'WAVED' },
      });
    }

    return this.findWaveById(tenantId, wave.wave_id);
  }

  /**
   * Release wave: allocate inventory for all orders in the wave,
   * generate picking tasks.
   */
  async releaseWave(tenantId: string, waveId: bigint, allocationService: any) {
    const wave = await this.prisma.picking_waves.findFirst({
      where: { tenant_id: tenantId, wave_id: waveId },
    });
    if (!wave) throw new BadRequestException('Wave not found');
    if (wave.status !== 'PENDING') throw new BadRequestException('Wave must be PENDING to release');

    const waveOrders = await this.prisma.wave_orders.findMany({
      where: { tenant_id: tenantId, wave_id: waveId },
    });

    // Step 1: Allocate inventory for all order lines
    for (const wo of waveOrders) {
      const orderLines = await this.prisma.sales_order_lines.findMany({
        where: { tenant_id: tenantId, order_id: wo.order_id },
      });
      for (const line of orderLines) {
        try {
          await allocationService.allocateForLine(
            tenantId, wave.facility_id, line.line_id, line.product_id, Number(line.requested_quantity),
          );
        } catch (err: any) {
          this.logger.warn(`Allocation issue for line ${line.line_id}: ${err.message}`);
        }
      }
    }

    // Step 2: Generate picking tasks per allocated location
    const allocations = await this.prisma.inventory_allocations.findMany({
      where: {
        tenant_id: tenantId,
        facility_id: wave.facility_id,
        allocated_for_reference_type: 'SALES_ORDER_LINE',
        status: 'ALLOCATED',
      },
    });

    let taskCount = 0;
    for (const alloc of allocations) {
      const line = await this.prisma.sales_order_lines.findFirst({
        where: { tenant_id: tenantId, line_id: alloc.allocated_for_reference_id },
      });
      if (!line) continue;

      const allocWaveOrder = waveOrders.find(
        (wo) => wo.order_id === line.order_id,
      );
      if (!allocWaveOrder) continue;

      const location = await this.prisma.storage_locations.findFirst({
        where: { tenant_id: tenantId, location_id: alloc.location_id },
      });

      const taskNumber = `PICK-${wave.wave_number}-${++taskCount}`;
      await this.prisma.picking_tasks.create({
        data: {
          tenant_id: tenantId,
          facility_id: wave.facility_id,
          task_number: taskNumber,
          order_id: line.order_id,
          order_line_id: line.line_id,
          allocation_id: alloc.allocation_id,
          wave_id: waveId,
          product_id: alloc.product_id,
          lot_id: alloc.lot_id,
          quantity_to_pick: Number(alloc.quantity_allocated),
          uom_id: 1,
          from_location_id: alloc.location_id,
          to_location_id: wave.facility_id,
          product_sku: line.product_id.toString(),
          status: 'AVAILABLE',
          priority: 5,
        },
      });
    }

    // Step 3: Update wave status, total tasks, and order status
    await this.prisma.picking_waves.updateMany({
      where: { tenant_id: tenantId, wave_id: waveId },
      data: { status: 'RELEASED', total_tasks: taskCount },
    });

    for (const wo of waveOrders) {
      await this.prisma.wave_orders.updateMany({
        where: { tenant_id: tenantId, wave_order_id: wo.wave_order_id },
        data: { status: 'IN_WAVE', released_at: new Date() },
      });
    }

    return this.findWaveById(tenantId, waveId);
  }

  /**
   * Complete a picking wave: mark all tasks completed, update wave status.
   */
  async completeWave(tenantId: string, waveId: bigint) {
    const wave = await this.prisma.picking_waves.findFirst({
      where: { tenant_id: tenantId, wave_id: waveId },
    });
    if (!wave) throw new BadRequestException('Wave not found');

    const tasks = await this.prisma.picking_tasks.findMany({
      where: { tenant_id: tenantId, wave_id: waveId },
    });

    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;

    await this.prisma.picking_waves.updateMany({
      where: { tenant_id: tenantId, wave_id: waveId },
      data: {
        status: 'COMPLETED',
        completed_at: new Date(),
        completed_tasks: completedTasks,
      },
    });

    // Close linked wave_orders
    await this.prisma.wave_orders.updateMany({
      where: { tenant_id: tenantId, wave_id: waveId },
      data: { status: 'COMPLETED', completed_at: new Date() },
    });

    return this.findWaveById(tenantId, waveId);
  }

  async findWaveById(tenantId: string, waveId: bigint) {
    const wave = await this.prisma.picking_waves.findFirst({
      where: { tenant_id: tenantId, wave_id: waveId },
      include: { warehouse_facilities: { select: { facility_name: true } } },
    });
    if (!wave) return null;
    const orders = await this.prisma.wave_orders.findMany({
      where: { tenant_id: tenantId, wave_id: waveId },
      include: { sales_orders: { select: { order_number: true } } },
    });
    const tasks = await this.prisma.picking_tasks.findMany({
      where: { tenant_id: tenantId, wave_id: waveId },
      orderBy: { task_id: 'asc' },
    });

    const statusCounts: Record<string, number> = {};
    for (const t of tasks) {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    }

    const totalTasks = tasks.length;
    const completedTasks = statusCounts['COMPLETED'] || 0;

    const { warehouse_facilities, ...waveData } = wave as any;
    const mappedOrders = orders.map((o: any) => {
      const { sales_orders, ...orderData } = o;
      return { ...orderData, order_number: sales_orders?.order_number };
    });

    return {
      ...waveData,
      facility_name: warehouse_facilities?.facility_name,
      orders: mappedOrders,
      tasks,
      summary: {
        ordersCount: orders.length,
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        completionPct: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        tasksByStatus: statusCounts,
      },
    };
  }

  async findAllWaves(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, facility_id: BigInt(query.facilityId) };
    if (query.status) where.status = query.status;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.picking_waves.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_date: 'desc' },
        include: { warehouse_facilities: { select: { facility_name: true } } },
      }),
      this.prisma.picking_waves.count({ where }),
    ]);
    const mapped = data.map((d: any) => {
      const { warehouse_facilities, ...rest } = d;
      return { ...rest, facility_name: warehouse_facilities?.facility_name };
    });
    return { data: mapped, total, page, limit };
  }

  async getWaveOrders(tenantId: string, waveId: bigint) {
    const rows = await this.prisma.wave_orders.findMany({
      where: { tenant_id: tenantId, wave_id: waveId },
      include: { sales_orders: { select: { order_number: true } } },
    });
    return rows.map((r: any) => {
      const { sales_orders, ...rest } = r;
      return { ...rest, order_number: sales_orders?.order_number };
    });
  }
}
