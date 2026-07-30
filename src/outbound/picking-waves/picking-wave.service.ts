import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import {
  WaveCreatedEvent,
  WaveReleasedEvent,
  WaveCompletedEvent,
  WaveCancelledEvent,
} from '../../events/definitions/outbound.events';

@Injectable()
export class PickingWaveService {
  private readonly logger = new Logger(PickingWaveService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

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

  async updateWave(tenantId: string, waveId: bigint, dto: any) {
    const wave = await this.prisma.picking_waves.findFirst({
      where: { tenant_id: tenantId, wave_id: waveId },
    });
    if (!wave) throw new BadRequestException('Wave not found');
    if (wave.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING waves can be edited');
    }
    const data: any = {};
    if (dto.wave_name !== undefined) data.wave_name = dto.wave_name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.wave_type !== undefined) data.wave_type = dto.wave_type;
    if (dto.assigned_to_user_id !== undefined) data.assigned_to_user_id = dto.assigned_to_user_id;
    if (dto.scheduled_start_time !== undefined) data.scheduled_start_time = new Date(dto.scheduled_start_time);
    if (dto.notes !== undefined) data.notes = dto.notes;
    await this.prisma.picking_waves.updateMany({
      where: { tenant_id: tenantId, wave_id: waveId },
      data,
    });
    return this.findWaveById(tenantId, waveId);
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
        wave_type: dto.wave_type || 'PICKING',
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

    this.eventEmitter.emit(
      'wave.created',
      new WaveCreatedEvent({
        tenant_id: tenantId,
        facility_id: facilityId,
        wave_id: wave.wave_id,
        wave_number: wave.wave_number,
        wave_type: wave.wave_type,
        order_count: dto.orders?.length || 0,
      }),
    );

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

    // Step 3: Update wave status, total tasks, released_at, and order status
    await this.prisma.picking_waves.updateMany({
      where: { tenant_id: tenantId, wave_id: waveId },
      data: { status: 'RELEASED', total_tasks: taskCount, released_at: new Date() },
    });

    for (const wo of waveOrders) {
      await this.prisma.wave_orders.updateMany({
        where: { tenant_id: tenantId, wave_order_id: wo.wave_order_id },
        data: { status: 'IN_WAVE', released_at: new Date() },
      });
    }

    this.eventEmitter.emit(
      'wave.released',
      new WaveReleasedEvent({
        tenant_id: tenantId,
        facility_id: wave.facility_id,
        wave_id: waveId,
        wave_number: wave.wave_number,
        order_count: waveOrders?.length || 0,
      }),
    );

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

    this.eventEmitter.emit(
      'wave.completed',
      new WaveCompletedEvent({
        tenant_id: tenantId,
        facility_id: wave.facility_id,
        wave_id: waveId,
        wave_number: wave.wave_number,
        completed_tasks: completedTasks,
      }),
    );

    return this.findWaveById(tenantId, waveId);
  }

  /**
   * Cancel a picking wave — reverts order statuses, cancels tasks, releases allocations.
   * Only PENDING or RELEASED waves can be cancelled.
   */
  async cancelWave(tenantId: string, waveId: bigint) {
    const wave = await this.prisma.picking_waves.findFirst({
      where: { tenant_id: tenantId, wave_id: waveId },
    });
    if (!wave) throw new BadRequestException('Wave not found');
    if (!['PENDING', 'RELEASED'].includes(wave.status)) {
      throw new BadRequestException(`Cannot cancel wave in '${wave.status}' status. Only PENDING or RELEASED waves can be cancelled.`);
    }

    const waveOrders = await this.prisma.wave_orders.findMany({
      where: { tenant_id: tenantId, wave_id: waveId },
    });

    // Revert order statuses from WAVED back to RELEASED
    for (const wo of waveOrders) {
      await this.prisma.sales_orders.updateMany({
        where: { tenant_id: tenantId, order_id: wo.order_id, status: 'WAVED' },
        data: { status: 'RELEASED' },
      });
    }

    // Cancel picking tasks in the wave
    const tasks = await this.prisma.picking_tasks.findMany({
      where: { tenant_id: tenantId, wave_id: waveId },
    });
    for (const task of tasks) {
      await this.prisma.picking_tasks.updateMany({
        where: { tenant_id: tenantId, task_id: task.task_id },
        data: { status: 'CANCELLED' as any },
      });
    }

    // Release inventory allocations for the cancelled wave's order lines
    const orderIds = waveOrders.map(wo => wo.order_id);
    if (orderIds.length) {
      const lines = await this.prisma.sales_order_lines.findMany({
        where: { tenant_id: tenantId, order_id: { in: orderIds } },
      });
      const lineIds = lines.map(l => l.line_id);
      if (lineIds.length) {
        await this.prisma.inventory_allocations.updateMany({
          where: {
            tenant_id: tenantId,
            allocated_for_reference_type: 'SALES_ORDER_LINE',
            allocated_for_reference_id: { in: lineIds },
            status: 'ALLOCATED',
          },
          data: { status: 'CANCELLED' },
        });
      }
    }

    // Mark wave-orders as removed
    for (const wo of waveOrders) {
      await this.prisma.wave_orders.updateMany({
        where: { tenant_id: tenantId, wave_order_id: wo.wave_order_id },
        data: { status: 'REMOVED', removed_at: new Date() },
      });
    }

    // Mark wave as CANCELLED
    await this.prisma.picking_waves.updateMany({
      where: { tenant_id: tenantId, wave_id: waveId },
      data: { status: 'CANCELLED', completed_at: new Date() },
    });

    this.eventEmitter.emit(
      'wave.cancelled',
      new WaveCancelledEvent({
        tenant_id: tenantId,
        facility_id: wave.facility_id,
        wave_id: waveId,
        wave_number: wave.wave_number,
      }),
    );

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
    const where: any = { tenant_id: tenantId, ...(query.facilityId ? { facility_id: BigInt(query.facilityId) } : {})  };
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
    // Batch count orders per wave
    const waveIds = data.map(d => d.wave_id) as bigint[];
    const orderCounts = waveIds.length
      ? await this.prisma.wave_orders.groupBy({
          by: ['wave_id'],
          where: { wave_id: { in: waveIds } },
          _count: { wave_order_id: true },
        })
      : [];
    const orderCountMap = new Map(orderCounts.map(oc => [oc.wave_id, oc._count.wave_order_id]));
    const mapped = data.map((d: any) => {
      const { warehouse_facilities, ...rest } = d;
      return { ...rest, facility_name: warehouse_facilities?.facility_name, order_count: orderCountMap.get(d.wave_id) ?? 0 };
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
