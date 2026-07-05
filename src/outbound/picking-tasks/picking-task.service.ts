import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PickExceptionReason, PICK_EXCEPTION_REASONS } from './pick-exception.enum';

@Injectable()
export class PickingTaskService {
  private readonly logger = new Logger(PickingTaskService.name);

  constructor(private readonly prisma: PrismaService) {}

  async deleteTask(tenantId: string, taskId: bigint) {
    return this.prisma.picking_tasks.deleteMany({
      where: { tenant_id: tenantId, task_id: taskId },
    });
  }

  /** Get next available pick task for a facility (RF) */
  async nextTask(tenantId: string, facilityId: bigint, userId?: string) {
    // First try to find an already ASSIGNED task for this user
    if (userId) {
      const assigned = await this.prisma.picking_tasks.findFirst({
        where: {
          tenant_id: tenantId,
          facility_id: facilityId,
          assigned_to_user_id: userId,
          status: 'ASSIGNED',
        },
        orderBy: { priority: 'asc' },
      });
      if (assigned) return assigned;
    }

    // Otherwise find the highest priority AVAILABLE task
    return this.prisma.picking_tasks.findFirst({
      where: {
        tenant_id: tenantId,
        facility_id: facilityId,
        status: 'AVAILABLE',
      },
      orderBy: [{ priority: 'asc' }, { task_id: 'asc' }],
    });
  }

  /** Assign a pick task to a user */
  async assignTask(tenantId: string, taskId: bigint, userId: string) {
    const task = await this.prisma.picking_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    if (!task) throw new BadRequestException('Task not found');
    if (task.status !== 'AVAILABLE') throw new BadRequestException('Task must be AVAILABLE to assign');

    await this.prisma.picking_tasks.updateMany({
      where: { tenant_id: tenantId, task_id: taskId },
      data: { assigned_to_user_id: userId, status: 'ASSIGNED' },
    });
    return this.findTaskById(tenantId, taskId);
  }

  /** Find task by ID with full detail (order line, product, location, picker) */
  async findTaskById(tenantId: string, taskId: bigint) {
    const task = await this.prisma.picking_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    if (!task) return null;

    const [product, location, orderLine, picker] = await Promise.all([
      this.prisma.products.findFirst({ where: { tenant_id: tenantId, product_id: task.product_id } }),
      task.from_location_id
        ? this.prisma.storage_locations.findFirst({ where: { tenant_id: tenantId, location_id: task.from_location_id } })
        : null,
      task.order_line_id
        ? this.prisma.sales_order_lines.findFirst({ where: { tenant_id: tenantId, line_id: task.order_line_id } })
        : null,
      task.assigned_to_user_id
        ? this.prisma.$queryRawUnsafe<Record<string, any>[]>(
            `SELECT id FROM multitenant.db_rf_sessions WHERE tenant_id = $1::uuid AND user_id = $2::uuid LIMIT 1`,
            tenantId, task.assigned_to_user_id,
          ).then((r) => r[0] || null)
        : null,
    ]);

    return { ...task, product, location, orderLine, picker };
  }

  /** Find task by barcode/task number (RF scan) */
  async findTaskByBarcode(tenantId: string, facilityId: bigint, barcode: string) {
    const task = await this.prisma.picking_tasks.findFirst({
      where: {
        tenant_id: tenantId,
        facility_id: facilityId,
        OR: [
          { task_number: barcode },
          { lpn_number: barcode },
        ],
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
      },
    });
    if (!task) {
      // Try finding by product SKU
      return this.prisma.picking_tasks.findFirst({
        where: {
          tenant_id: tenantId,
          facility_id: facilityId,
          product_sku: barcode,
          status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
        },
      });
    }
    return task;
  }

  /** RF: scan location to verify correct pick location */
  async scanLocation(tenantId: string, taskId: bigint, locationBarcode: string) {
    const task = await this.prisma.picking_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    if (!task) throw new BadRequestException('Task not found');

    const location = await this.prisma.storage_locations.findFirst({
      where: { tenant_id: tenantId, location_code: locationBarcode },
    });
    if (!location) throw new BadRequestException('Location not found');

    if (!task.from_location_id || Number(location.location_id) !== Number(task.from_location_id)) {
      throw new BadRequestException('Scanned location does not match expected pick location');
    }

    // Mark task as IN_PROGRESS when location is confirmed
    if (task.status === 'ASSIGNED') {
      await this.prisma.picking_tasks.updateMany({
        where: { tenant_id: tenantId, task_id: taskId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return { task, location, locationVerified: true };
  }

  /** RF: scan product to verify correct product */
  async scanProduct(tenantId: string, taskId: bigint, productCode: string) {
    const task = await this.prisma.picking_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    if (!task) throw new BadRequestException('Task not found');

    let product = await this.prisma.products.findFirst({
      where: { tenant_id: tenantId, product_code: productCode },
    });
    if (!product) {
      const pb = await this.prisma.product_barcodes.findFirst({
        where: { tenant_id: tenantId, barcode_value: productCode },
        include: { products: true },
      });
      product = pb?.products || null;
    }
    if (!product) throw new BadRequestException('Product not found');
    if (Number(product.product_id) !== Number(task.product_id)) {
      throw new BadRequestException('Scanned product does not match expected product');
    }

    return { task, product, productVerified: true };
  }

  /**
   * RF: confirm pick — record the picked quantity, update inventory,
   * create inventory transaction, update order line fulfilled qty.
   */
  async confirmPick(tenantId: string, taskId: bigint, dto: any) {
    const task = await this.prisma.picking_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    if (!task) throw new BadRequestException('Task not found');
    if (task.status !== 'ASSIGNED' && task.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Task must be ASSIGNED or IN_PROGRESS to confirm');
    }

    const pickedQty = Number(dto.pickedQuantity || task.quantity_to_pick);
    const toLocationId = dto.putToLocationId ? BigInt(dto.putToLocationId) : task.to_location_id;

    // Update pick task
    await this.prisma.picking_tasks.updateMany({
      where: { tenant_id: tenantId, task_id: taskId },
      data: {
        quantity_picked: pickedQty,
        status: 'COMPLETED',
        completed_at: new Date(),
        to_location_id: toLocationId,
      },
    });

    if (!task.from_location_id) throw new BadRequestException('Task missing from_location_id');

    await this.prisma.inventory_on_hand.updateMany({
      where: { tenant_id: tenantId, facility_id: task.facility_id, product_id: task.product_id, location_id: task.from_location_id },
      data: { quantity_on_hand: { decrement: pickedQty } },
    });

    await this.prisma.inventory_transactions.create({
      data: {
        tenant_id: tenantId,
        facility_id: task.facility_id,
        reference_type: 'PICKING_TASK',
        reference_id: task.task_id,
        product_id: task.product_id,
        from_location_id: task.from_location_id,
        to_location_id: toLocationId,
        lot_id: task.lot_id,
        transaction_type: 'PICK',
        transaction_status: 'COMPLETED',
        quantity: pickedQty,
        uom_id: 1,
        reason_code: dto.reasonCode || 'STANDARD',
        reference_document_type: 'PICKING_WAVE',
      },
    });

    // Update order line fulfilled quantity
    if (task.order_line_id) {
      const line = await this.prisma.sales_order_lines.findFirst({
        where: { tenant_id: tenantId, line_id: task.order_line_id },
      });
      if (line) {
        const newFulfilledQty = Number(line.fulfilled_quantity || 0) + pickedQty;
        await this.prisma.sales_order_lines.updateMany({
          where: { tenant_id: tenantId, line_id: task.order_line_id },
          data: {
            fulfilled_quantity: newFulfilledQty,
            status: newFulfilledQty >= Number(line.requested_quantity) ? 'PICKED' : 'ALLOCATED',
          },
        });

        // Check if all lines are picked -> update order status
        await this.checkOrderPickedStatus(tenantId, line.order_id);
      }
    }

    return this.findTaskById(tenantId, taskId);
  }

  /**
   * RF: confirm pick by scanning LPN at source location.
   * Validates LPN is at the expected pick location and contains the expected product.
   */
  async confirmPickByLpn(tenantId: string, taskId: bigint, lpnBarcode: string) {
    const task = await this.prisma.picking_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    if (!task) throw new BadRequestException('Task not found');

    const lpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, facility_id: task.facility_id, lpn_number: lpnBarcode },
    });
    if (!lpn) throw new BadRequestException('LPN not found');

    // Verify LPN is at the expected pick location
    if (lpn.location_id !== task.from_location_id) {
      throw new BadRequestException('LPN not found at expected pick location');
    }

    // Verify LPN contains the expected product
    if (lpn.product_id && Number(lpn.product_id) !== Number(task.product_id)) {
      throw new BadRequestException('LPN contains different product than expected');
    }

    return this.confirmPick(tenantId, taskId, {
      pickedQuantity: Number(task.quantity_to_pick),
      lpnBarcode,
      reasonCode: 'LPN_SCAN',
    });
  }

  /**
   * RF: Scan destination tote/carton barcode, create or validate tote LPN
   * and set it as the task's put-to location (Manhattan step: Scan Destination Tote).
   */
  async scanTote(tenantId: string, taskId: bigint, toteBarcode: string, facilityId: bigint) {
    const task = await this.prisma.picking_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    if (!task) throw new BadRequestException('Task not found');

    // Find or create the tote LPN
    let tote = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, lpn_number: toteBarcode },
    });
    if (!tote) {
      const stagingLocation = await this.prisma.storage_locations.findFirst({
        where: { tenant_id: tenantId, facility_id: facilityId, location_type: 'TEMPORARY' },
        orderBy: { location_code: 'asc' },
      });
      tote = await this.prisma.license_plate_numbers.create({
        data: {
          tenant_id: tenantId,
          facility_id: facilityId,
          lpn_number: toteBarcode,
          location_id: stagingLocation?.location_id || 0,
          lpn_type: 'TOTE',
          status: 'PICK_PENDING',
        },
      });
    }

    // Set tote as the task's destination
    await this.prisma.picking_tasks.updateMany({
      where: { tenant_id: tenantId, task_id: taskId },
      data: { to_location_id: tote.location_id, notes: `Tote LPN: ${toteBarcode}` },
    });

    return { taskId: taskId.toString(), toteId: tote.lpn_id.toString(), toteNumber: tote.lpn_number };
  }

  /** Handle short pick — pick less than requested quantity */
  async shortPick(tenantId: string, taskId: bigint, dto: any) {
    const task = await this.prisma.picking_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    if (!task) throw new BadRequestException('Task not found');

    const actualPicked = Number(dto.actualPickedQuantity || 0);
    if (actualPicked <= 0) throw new BadRequestException('Picked quantity must be > 0');

    const rawReason = dto.shortReason || dto.exceptionReason || 'SHORT';
    if (!PICK_EXCEPTION_REASONS.includes(rawReason as PickExceptionReason)) {
      throw new BadRequestException(`Invalid exception reason: ${rawReason}. Valid: ${PICK_EXCEPTION_REASONS.join(', ')}`);
    }

    // Complete the task with partial quantity
    await this.prisma.picking_tasks.updateMany({
      where: { tenant_id: tenantId, task_id: taskId },
      data: {
        quantity_picked: actualPicked,
        status: 'COMPLETED',
        completed_at: new Date(),
        hold_reason: rawReason,
      },
    });

    if (!task.from_location_id) throw new BadRequestException('Task missing from_location_id');

    await this.prisma.inventory_on_hand.updateMany({
      where: { tenant_id: tenantId, facility_id: task.facility_id, product_id: task.product_id, location_id: task.from_location_id },
      data: { quantity_on_hand: { decrement: actualPicked } },
    });

    // Mark order line as SHORT
    if (task.order_line_id) {
      await this.prisma.sales_order_lines.updateMany({
        where: { tenant_id: tenantId, line_id: task.order_line_id },
        data: { status: 'SHORT' },
      });
    }

    // Trigger quality hold for damage-related exceptions
    if (rawReason === 'DAMAGE' || rawReason === 'PACKAGING_ISSUE') {
      try {
        const holdReason = rawReason === 'DAMAGE' ? 'DAMAGED' : 'QUALITY_ISSUE';
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO multitenant.quality_holds
             (tenant_id, facility_id, product_id, lpn_id, hold_reason, status, placed_by_user_id, notes, created_at)
           VALUES ($1::uuid, $2, $3, NULL, $4, 'ACTIVE', $5, $6, NOW())`,
          tenantId,
          task.facility_id,
          task.product_id,
          holdReason,
          task.assigned_to_user_id || '',
          `Auto-hold from short pick exception: ${rawReason}`,
        );
      } catch (_) { /* non-blocking */ }
    }

    return { taskId: taskId.toString(), pickedQty: actualPicked, requestedQty: task.quantity_to_pick, shortQty: Number(task.quantity_to_pick) - actualPicked };
  }

  /** Get tasks assigned to a user (RF: my-tasks) */
  async myTasks(tenantId: string, userId: string, facilityId?: bigint) {
    const where: any = { tenant_id: tenantId, assigned_to_user_id: userId };
    if (facilityId) where.facility_id = facilityId;
    where.status = { not: 'COMPLETED' };

    return this.prisma.picking_tasks.findMany({
      where,
      orderBy: { priority: 'asc' },
    });
  }

  /** Get all tasks with filtering */
  async findAllTasks(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.waveId) where.wave_id = BigInt(query.waveId);
    if (query.status) where.status = query.status;
    if (query.assignedToUserId) where.assigned_to_user_id = query.assignedToUserId;

    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.picking_tasks.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_date: 'desc' },
      }),
      this.prisma.picking_tasks.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  private async checkOrderPickedStatus(tenantId: string, orderId: bigint) {
    const lines = await this.prisma.sales_order_lines.findMany({
      where: { tenant_id: tenantId, order_id: orderId },
    });
    if (!lines.length) return;

    const allPicked = lines.every((l) => l.status === 'PICKED');
    if (allPicked) {
      await this.prisma.sales_orders.updateMany({
        where: { tenant_id: tenantId, order_id: orderId },
        data: { status: 'PICKED' },
      });
    }
  }

  /** Web: Mark a picking task as COMPLETED */
  async completeTask(tenantId: string, taskId: string, userId: string) {
    const task = await this.prisma.picking_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: BigInt(taskId) },
    });
    if (!task) throw new NotFoundException('Picking task not found');
    if (task.status === 'COMPLETED') throw new BadRequestException('Task is already completed');

    const pickedQty = Number(task.quantity_picked || task.quantity_to_pick);

    await this.prisma.picking_tasks.updateMany({
      where: { tenant_id: tenantId, task_id: BigInt(taskId) },
      data: {
        status: 'COMPLETED',
        quantity_picked: pickedQty,
        completed_at: new Date(),
        updated_by: userId,
      },
    });

    return this.findTaskById(tenantId, BigInt(taskId));
  }

  /** Web: Cancel a picking task with a Manhattan structured reason code */
  async cancelTask(tenantId: string, taskId: string, reason: string) {
    const task = await this.prisma.picking_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: BigInt(taskId) },
    });
    if (!task) throw new NotFoundException('Picking task not found');
    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      throw new BadRequestException('Task cannot be cancelled in its current state');
    }

    const validReason: PickExceptionReason = reason && PICK_EXCEPTION_REASONS.includes(reason as PickExceptionReason)
      ? (reason as PickExceptionReason)
      : PickExceptionReason.OTHER;

    await this.prisma.picking_tasks.updateMany({
      where: { tenant_id: tenantId, task_id: BigInt(taskId) },
      data: {
        status: 'CANCELLED',
        hold_reason: validReason,
        updated_by: task.assigned_to_user_id,
      },
    });

    return this.findTaskById(tenantId, BigInt(taskId));
  }
}
