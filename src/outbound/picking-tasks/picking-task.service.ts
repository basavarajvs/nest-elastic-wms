import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PickRouteService } from './pick-route.service';
import { PickExceptionReason, PICK_EXCEPTION_REASONS } from './pick-exception.enum';
import { ReplenishmentService } from '../replenishment/replenishment.service';

const LOCATION_MISMATCH_LIMIT = 3;

@Injectable()
export class PickingTaskService {
  private readonly logger = new Logger(PickingTaskService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pickRouteService: PickRouteService,
    private readonly replenishmentService: ReplenishmentService,
  ) {}

  async deleteTask(tenantId: string, taskId: bigint) {
    const task = await this.findTaskById(tenantId, taskId);
    await this.prisma.picking_tasks.deleteMany({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    return task;
  }

  // APP-PICK-I: Atomic nextTask with APP-PICK-B equipment filtering and route optimization
  async nextTask(tenantId: string, facilityId: bigint, userId?: string) {
    if (userId) {
      const assigned = await this.prisma.picking_tasks.findFirst({
        where: { tenant_id: tenantId, facility_id: facilityId, assigned_to_user_id: userId, status: 'ASSIGNED' },
        orderBy: { priority: 'asc' },
      });
      if (assigned) {
        const risk = await this.validatePrePick(tenantId, assigned.task_id);
        if (risk) return risk;
        return this.findTaskById(tenantId, assigned.task_id);
      }
    }

    // APP-PICK-B: Read operator equipment type from RF session
    let operatorEquipment: string | null = null;
    if (userId) {
      const session = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
        `SELECT equipment_type FROM multitenant.db_rf_sessions WHERE tenant_id = $1::uuid AND user_id = $2::uuid AND status = 'ACTIVE' LIMIT 1`,
        tenantId, userId,
      ).then(r => r[0] || null);
      if (session?.equipment_type) operatorEquipment = session.equipment_type;
    }

    // APP-PICK-C: Only target FORWARD_PICK locations — need to join storage_locations
    const whereClause = operatorEquipment
      ? `t.tenant_id = $1::uuid AND t.facility_id = $2 AND t.status = 'AVAILABLE'` +
        ` AND t.required_equipment = $3`
      : `t.tenant_id = $1::uuid AND t.facility_id = $2 AND t.status = 'AVAILABLE'`;

    const params: any[] = [tenantId, facilityId];
    if (operatorEquipment) params.push(operatorEquipment);

    const tasks = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT t.* FROM multitenant.picking_tasks t
       LEFT JOIN multitenant.storage_locations sl ON sl.tenant_id = t.tenant_id AND sl.location_id = t.from_location_id
       WHERE ${whereClause}
       AND (sl.location_type IS NULL OR sl.location_type NOT IN ('RESERVE'))
       ORDER BY t.priority ASC, t.task_id ASC
       LIMIT 5`,
      ...params,
    );

    if (!tasks.length) return null;

    // GAP-5.3: Apply route optimization when multiple tasks found
    let orderedTasks = tasks;
    if (tasks.length > 1) {
      orderedTasks = await this.pickRouteService.optimizePickRoute(tenantId, tasks);
    }

    const bestTask = orderedTasks[0];
    const availableId = BigInt(bestTask.task_id);

    const risk = await this.validatePrePick(tenantId, availableId);
    if (risk) return risk;

    if (userId) {
      const updated = await this.prisma.picking_tasks.updateMany({
        where: { tenant_id: tenantId, facility_id: facilityId, task_id: availableId, status: 'AVAILABLE' },
        data: { status: 'ASSIGNED', assigned_to_user_id: userId,
                route_sequence: bestTask.route_sequence || null },
      });
      if (updated.count === 0) {
        // Race lost — another picker grabbed it; recurse
        return this.nextTask(tenantId, facilityId, userId);
      }
      await this.writePickAudit(tenantId, availableId, 'TASK_ASSIGNED', null, userId);
    }

    // GAP-5.3: Save route for the wave
    if (tasks.length > 1 && bestTask.wave_id) {
      this.pickRouteService.saveRoute(tenantId, BigInt(bestTask.wave_id), userId || '', orderedTasks).catch(() => {});
    }

    return this.findTaskById(tenantId, availableId);
  }

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

  /** Find task by ID with full detail (order line, product, location, picker) + GAP-3.3 case pick display */
  async findTaskById(tenantId: string, taskId: bigint) {
    const task = await this.prisma.picking_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    if (!task) return null;

    const [product, location, orderLine, picker, facility, order, wave] = await Promise.all([
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
      this.prisma.warehouse_facilities.findFirst({ where: { tenant_id: tenantId, facility_id: task.facility_id }, select: { facility_name: true } }),
      task.order_id
        ? this.prisma.sales_orders.findFirst({ where: { tenant_id: tenantId, order_id: task.order_id }, select: { order_number: true } })
        : null,
      task.wave_id
        ? this.prisma.picking_waves.findFirst({ where: { tenant_id: tenantId, wave_id: task.wave_id }, select: { wave_name: true } })
        : null,
    ]);

    // GAP-3.3: Compute case/pallet counts for display
    let requestedCases: number | null = null;
    let requestedEaches: number | null = null;
    if (product) {
      const qty = Number(task.quantity_to_pick);
      const eachesPerCase = product.eaches_per_case || 1;
      requestedEaches = qty;
      if (task.pick_type === 'CASE' && eachesPerCase > 0) {
        requestedCases = Math.ceil(qty / eachesPerCase);
        requestedEaches = qty % eachesPerCase;
      } else if (task.pick_type === 'PALLET') {
        const eachesPerPallet = (product.eaches_per_case || 1) * (product.cases_per_pallet || 1);
        requestedCases = eachesPerPallet > 0 ? Math.ceil(qty / eachesPerPallet) : null;
      }
    }

    return {
      ...task,
      facility_name: facility?.facility_name || null,
      product_name: product?.product_name || null,
      order_number: order?.order_number || null,
      wave_name: wave?.wave_name || null,
      from_location_name: location?.location_name || null,
      to_location_name: task.to_location_id
        ? (await this.prisma.storage_locations.findFirst({ where: { tenant_id: tenantId, location_id: task.to_location_id }, select: { location_name: true } }))?.location_name || null
        : null,
      product,
      location,
      orderLine,
      picker,
      pickType: task.pick_type || 'EACH',
      requestedCases,
      requestedEaches,
    };
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

  // APP-PICK-G: Enhanced scanLocation with detailed rejection, mismatch logging, and three-attempt lock
  async scanLocation(tenantId: string, taskId: bigint, locationBarcode: string) {
    const task = await this.prisma.picking_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    if (!task) throw new BadRequestException('Task not found');

    const scannedLoc = await this.prisma.storage_locations.findFirst({
      where: { tenant_id: tenantId, location_code: locationBarcode },
    });
    if (!scannedLoc) throw new BadRequestException('Location not found');

    if (!task.from_location_id || Number(scannedLoc.location_id) !== Number(task.from_location_id)) {
      const expectedLoc = task.from_location_id
        ? await this.prisma.storage_locations.findFirst({ where: { tenant_id: tenantId, location_id: task.from_location_id } })
        : null;
      const expectedCode = expectedLoc?.location_code || 'UNKNOWN';

      // Log mismatch attempt
      await this.writePickAudit(tenantId, taskId, 'LOCATION_MISMATCH', null, task.assigned_to_user_id, {
        scanned: locationBarcode,
        expected: expectedCode,
      });

      // APP-PICK-G: Track mismatch count and auto-lock after 3 attempts
      const currentCount = Number(task.mismatch_count || 0) + 1;
      await this.prisma.picking_tasks.updateMany({
        where: { tenant_id: tenantId, task_id: taskId },
        data: { mismatch_count: currentCount },
      });

      if (currentCount >= LOCATION_MISMATCH_LIMIT) {
        await this.prisma.picking_tasks.updateMany({
          where: { tenant_id: tenantId, task_id: taskId },
          data: { status: 'ON_HOLD', hold_reason: 'LOCATION_MISMATCH_LOCK' },
        });
        await this.writePickAudit(tenantId, taskId, 'TASK_LOCKED', null, task.assigned_to_user_id, {
          reason: `Exceeded ${LOCATION_MISMATCH_LIMIT} location mismatch attempts`,
        });
        throw new BadRequestException(
          `TASK LOCKED — Exceeded ${LOCATION_MISMATCH_LIMIT} location mismatch attempts. Contact supervisor.`,
        );
      }

      throw new BadRequestException(
        `WRONG LOCATION — Expected: ${expectedCode}, Scanned: ${locationBarcode} (Attempt ${currentCount}/${LOCATION_MISMATCH_LIMIT})`,
      );
    }

    if (task.status === 'ASSIGNED') {
      await this.prisma.picking_tasks.updateMany({
        where: { tenant_id: tenantId, task_id: taskId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    await this.writePickAudit(tenantId, taskId, 'LOCATION_SCANNED', scannedLoc.location_code, task.assigned_to_user_id);

    return { task, location: scannedLoc, locationVerified: true };
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

    await this.writePickAudit(tenantId, taskId, 'PRODUCT_VERIFIED', product.product_code, task.assigned_to_user_id);

    return { task, product, productVerified: true };
  }

  // GAP-3.1: Enhanced confirmPick with case/pallet UOM support
  async confirmPick(tenantId: string, taskId: bigint, dto: any) {
    const task = await this.prisma.picking_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    if (!task) throw new BadRequestException('Task not found');
    if (task.status !== 'ASSIGNED' && task.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Task must be ASSIGNED or IN_PROGRESS to confirm');
    }

    const rawQty = Number(dto.pickedQuantity || task.quantity_to_pick);
    const pickType = dto.pickType || task.pick_type || 'EACH';
    const uomId = dto.uomId || task.uom_id;

    // GAP-3.1: Convert case/pallet qty to eaches
    let pickedQty = rawQty;
    if (pickType === 'CASE' || pickType === 'PALLET') {
      const product = await this.prisma.products.findFirst({
        where: { tenant_id: tenantId, product_id: task.product_id },
      });
      if (product) {
        const eachesPerCase = product.eaches_per_case || 1;
        if (pickType === 'CASE') {
          pickedQty = rawQty * eachesPerCase;
        } else if (pickType === 'PALLET') {
          const eachesPerPallet = eachesPerCase * (product.cases_per_pallet || 1);
          pickedQty = rawQty * eachesPerPallet;
        }
      }
    }

    const toLocationId = dto.putToLocationId ? BigInt(dto.putToLocationId) : task.to_location_id;

    await this.prisma.picking_tasks.updateMany({
      where: { tenant_id: tenantId, task_id: taskId },
      data: {
        quantity_picked: pickedQty,
        status: 'COMPLETED',
        completed_at: new Date(),
        to_location_id: toLocationId,
        pick_type: pickType,
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
        uom_id: uomId,
        reason_code: dto.reasonCode || 'STANDARD',
        reference_document_type: 'PICKING_WAVE',
      },
    });

    // APP-PICK-J: Write audit entry
    await this.writePickAudit(tenantId, taskId, 'PICK_CONFIRMED', null, task.assigned_to_user_id, {
      pickedQty,
      pickType,
    });

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

        await this.checkOrderPickedStatus(tenantId, line.order_id);
      }
    }

    // GAP-4.3: Check wave completion after pick
    if (task.wave_id) {
      await this.checkWaveCompletion(tenantId, task.wave_id);
    }

    return this.findTaskById(tenantId, taskId);
  }

  async confirmPickByLpn(tenantId: string, taskId: bigint, lpnBarcode: string) {
    const task = await this.prisma.picking_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    if (!task) throw new BadRequestException('Task not found');

    const lpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, facility_id: task.facility_id, lpn_number: lpnBarcode },
    });
    if (!lpn) throw new BadRequestException('LPN not found');

    if (lpn.location_id !== task.from_location_id) {
      throw new BadRequestException('LPN not found at expected pick location');
    }

    if (lpn.product_id && Number(lpn.product_id) !== Number(task.product_id)) {
      throw new BadRequestException('LPN contains different product than expected');
    }

    return this.confirmPick(tenantId, taskId, {
      pickedQuantity: Number(task.quantity_to_pick),
      lpnBarcode,
      reasonCode: 'LPN_SCAN',
    });
  }

  /** APP-PICK-H: Scan tote with tote-to-order validation */
  async scanTote(tenantId: string, taskId: bigint, toteBarcode: string, facilityId: bigint) {
    const task = await this.prisma.picking_tasks.findFirst({ where: { tenant_id: tenantId, task_id: taskId } });
    if (!task) throw new BadRequestException('Task not found');

    let tote = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, lpn_number: toteBarcode },
    });
    if (tote) {
      if (task.order_line_id && tote.assigned_shipment_id) {
        const line = await this.prisma.sales_order_lines.findFirst({ where: { tenant_id: tenantId, line_id: task.order_line_id } });
        if (line && line.order_id && tote.assigned_shipment_id !== line.order_id) {
          throw new BadRequestException(`WRONG TOTE — Belongs to Order ${tote.assigned_shipment_id}`);
        }
      }
    } else {
      const stagingLocation = await this.prisma.storage_locations.findFirst({
        where: { tenant_id: tenantId, facility_id: facilityId, location_type: 'TEMPORARY' },
        orderBy: { location_code: 'asc' },
      });
      tote = await this.prisma.license_plate_numbers.create({
        data: { tenant_id: tenantId, facility_id: facilityId, lpn_number: toteBarcode,
          location_id: stagingLocation?.location_id || 0, lpn_type: 'TOTE', status: 'PICK_PENDING' },
      });
    }
    await this.prisma.picking_tasks.updateMany({
      where: { tenant_id: tenantId, task_id: taskId },
      data: { to_location_id: tote.location_id, notes: `Tote: ${toteBarcode}` },
    });

    await this.writePickAudit(tenantId, taskId, 'TOTE_SCANNED', toteBarcode, task.assigned_to_user_id);

    return { taskId: taskId.toString(), toteId: tote.lpn_id.toString(), toteNumber: tote.lpn_number };
  }

  // APP-PICK-E: Enhanced shortPick with reason code validation and backorder creation
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

    // APP-PICK-E: Validate reason code against short_pick_reasons table
    const reasonRecord = await this.prisma.short_pick_reasons.findFirst({
      where: { tenant_id: tenantId, reason_code: rawReason, is_active: true },
    });

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

    // APP-PICK-E: Trigger investigation if reason code requires it
    if (reasonRecord?.triggers_investigation) {
      try {
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO multitenant.quality_holds
             (tenant_id, facility_id, product_id, lpn_id, hold_reason, status, placed_by_user_id, notes, created_at)
           VALUES ($1::uuid, $2, $3, NULL, $4, 'ACTIVE', $5, $6, NOW())`,
          tenantId, task.facility_id, task.product_id,
          `SHORT_PICK_INVESTIGATION:${rawReason}`,
          task.assigned_to_user_id || '',
          `Short pick investigation triggered by reason: ${rawReason}`,
        );
      } catch (_) { /* non-blocking */ }
    }

    // Mark order line as SHORT
    if (task.order_line_id) {
      await this.prisma.sales_order_lines.updateMany({
        where: { tenant_id: tenantId, line_id: task.order_line_id },
        data: { status: 'SHORT' },
      });

      // APP-PICK-F: Create backorder for shortfall
      const shortfall = Number(task.quantity_to_pick) - actualPicked;
      if (shortfall > 0) {
        await this.createBackorder(tenantId, task.order_line_id, shortfall);
      }
    }

    // APP-PICK-J: Write audit
    await this.writePickAudit(tenantId, taskId, 'SHORT_PICK', null, task.assigned_to_user_id, {
      actualPicked,
      shortQty: Number(task.quantity_to_pick) - actualPicked,
      reason: rawReason,
    });

    // GAP-4.3: Check wave completion
    if (task.wave_id) {
      await this.checkWaveCompletion(tenantId, task.wave_id);
    }

    return { taskId: taskId.toString(), pickedQty: actualPicked, requestedQty: task.quantity_to_pick, shortQty: Number(task.quantity_to_pick) - actualPicked };
  }

  async myTasks(tenantId: string, userId: string, facilityId?: bigint) {
    const where: any = { tenant_id: tenantId, assigned_to_user_id: userId };
    if (facilityId) where.facility_id = facilityId;
    where.status = { not: 'COMPLETED' };

    const tasks = await this.prisma.picking_tasks.findMany({
      where,
      orderBy: { priority: 'asc' },
    });
    return this.enrichTasksWithNames(tenantId, tasks);
  }

  async findAllTasks(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.waveId) where.wave_id = BigInt(query.waveId);
    if (query.status) where.status = query.status;
    if (query.assignedToUserId) where.assigned_to_user_id = query.assignedToUserId;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.picking_tasks.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_date: 'desc' },
      }),
      this.prisma.picking_tasks.count({ where }),
    ]);
    return { data: await this.enrichTasksWithNames(tenantId, data), total, page, limit };
  }

  // GAP-7: Pre-pick allocation validation
  // GAP-7.2: Auto-replenishment trigger when inventory insufficient
  async validatePrePick(tenantId: string, taskId: bigint) {
    const task = await this.prisma.picking_tasks.findFirst({ where: { tenant_id: tenantId, task_id: taskId } });
    if (!task || !task.from_location_id) return null;
    const onHand = await this.prisma.inventory_on_hand.aggregate({
      where: { tenant_id: tenantId, facility_id: task.facility_id, product_id: task.product_id, location_id: task.from_location_id },
      _sum: { quantity_on_hand: true },
    });
    const available = Number(onHand._sum?.quantity_on_hand || 0);
    if (available < Number(task.quantity_to_pick)) {
      await this.prisma.picking_tasks.updateMany({
        where: { tenant_id: tenantId, task_id: taskId },
        data: { hold_reason: 'INVENTORY_SHORT', at_risk: true },
      });
      await this.writePickAudit(tenantId, taskId, 'PREPICK_AT_RISK', null, null, { available, required: Number(task.quantity_to_pick) });

      // GAP-7.2: Auto-trigger replenishment if auto-generate rule exists
      try {
        const rule = await this.prisma.replenishment_rules.findFirst({
          where: { tenant_id: tenantId, facility_id: task.facility_id, product_id: task.product_id, auto_generate_tasks: true, is_active: true },
        });
        if (rule) {
          const reserveLoc = await this.prisma.storage_locations.findFirst({
            where: { tenant_id: tenantId, facility_id: task.facility_id, location_type: 'RESERVE' },
          });
          if (reserveLoc) {
            const reserveInv = await this.prisma.inventory_on_hand.findFirst({
              where: { tenant_id: tenantId, product_id: task.product_id, location_id: reserveLoc.location_id },
            });
            const reserveQty = reserveInv?.quantity_on_hand || 0;
            if (Number(reserveQty) > 0) {
              await this.prisma.replenishment_tasks.create({
                data: {
                  tenant_id: tenantId,
                  facility_id: task.facility_id,
                  task_number: `AUTO-REPL-${Date.now()}`,
                  product_id: task.product_id,
                  from_location_id: reserveLoc.location_id,
                  to_location_id: task.from_location_id,
                  quantity_requested: Number(task.quantity_to_pick) - available,
                  priority: 10,
                  created_by: task.assigned_to_user_id,
                },
              });
              await this.prisma.picking_tasks.updateMany({
                where: { tenant_id: tenantId, task_id: taskId },
                data: { hold_reason: 'WAITING_REPLENISHMENT', at_risk: true },
              });
            }
          }
        }
      } catch (err) {
        this.logger.warn(`Auto-replenishment trigger failed: ${(err as Error).message}`);
      }

      return { atRisk: true, available, required: Number(task.quantity_to_pick), taskId: taskId.toString() };
    }
    return null;
  }

  // APP-PICK-F: Create backorder for unfulfilled quantity
  async createBackorder(tenantId: string, orderLineId: bigint, shortfallQty: number) {
    const existing = await this.prisma.backorder_records.findFirst({
      where: { tenant_id: tenantId, order_line_id: orderLineId, status: 'OPEN' },
    });
    if (existing) {
      await this.prisma.backorder_records.updateMany({
        where: { tenant_id: tenantId, backorder_id: existing.backorder_id },
        data: { shortfall_qty: { increment: shortfallQty } },
      });
      return existing;
    }
    return this.prisma.backorder_records.create({
      data: { tenant_id: tenantId, order_line_id: orderLineId, shortfall_qty: shortfallQty, status: 'OPEN' },
    });
  }

  private async enrichTasksWithNames(tenantId: string, tasks: any[]): Promise<any[]> {
    if (!tasks.length) return tasks;

    const facilityIds = [...new Set(tasks.map(t => t.facility_id).filter(Boolean))];
    const productIds = [...new Set(tasks.map(t => t.product_id).filter(Boolean))];
    const orderIds = [...new Set(tasks.map(t => t.order_id).filter(Boolean))];
    const waveIds = [...new Set(tasks.map(t => t.wave_id).filter(Boolean))];
    const fromLocationIds = [...new Set(tasks.map(t => t.from_location_id).filter(Boolean))];
    const toLocationIds = [...new Set(tasks.map(t => t.to_location_id).filter(Boolean))];
    const locationIds = [...new Set([...fromLocationIds, ...toLocationIds])];

    const [facilities, products, orders, waves, locations] = await Promise.all([
      facilityIds.length
        ? this.prisma.warehouse_facilities.findMany({ where: { tenant_id: tenantId, facility_id: { in: facilityIds } }, select: { facility_id: true, facility_name: true } })
        : [],
      productIds.length
        ? this.prisma.products.findMany({ where: { tenant_id: tenantId, product_id: { in: productIds } }, select: { product_id: true, product_name: true } })
        : [],
      orderIds.length
        ? this.prisma.sales_orders.findMany({ where: { tenant_id: tenantId, order_id: { in: orderIds } }, select: { order_id: true, order_number: true } })
        : [],
      waveIds.length
        ? this.prisma.picking_waves.findMany({ where: { tenant_id: tenantId, wave_id: { in: waveIds } }, select: { wave_id: true, wave_name: true } })
        : [],
      locationIds.length
        ? this.prisma.storage_locations.findMany({ where: { tenant_id: tenantId, location_id: { in: locationIds } }, select: { location_id: true, location_name: true } })
        : [],
    ]);

    const facilityMap = new Map(facilities.map(f => [Number(f.facility_id), f.facility_name] as [number, string]));
    const productMap = new Map(products.map(p => [Number(p.product_id), p.product_name] as [number, string]));
    const orderMap = new Map(orders.map(o => [Number(o.order_id), o.order_number] as [number, string]));
    const waveMap = new Map(waves.map(w => [Number(w.wave_id), w.wave_name] as [number, string]));
    const locationMap = new Map(locations.map(l => [Number(l.location_id), l.location_name] as [number, string]));

    return tasks.map(task => ({
      ...task,
      facility_name: facilityMap.get(Number(task.facility_id)) || null,
      product_name: productMap.get(Number(task.product_id)) || null,
      order_number: orderMap.get(Number(task.order_id)) || null,
      wave_name: waveMap.get(Number(task.wave_id)) || null,
      from_location_name: locationMap.get(Number(task.from_location_id)) || null,
      to_location_name: locationMap.get(Number(task.to_location_id)) || null,
    }));
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

  // GAP-4.3: Check wave completion after a task is completed
  async checkWaveCompletion(tenantId: string, waveId: bigint) {
    const wave = await this.prisma.picking_waves.findFirst({
      where: { tenant_id: tenantId, wave_id: waveId },
    });
    if (!wave || wave.status === 'COMPLETED' || wave.status === 'CLOSED') return;

    const tasks = await this.prisma.picking_tasks.findMany({
      where: { tenant_id: tenantId, wave_id: waveId },
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const shortPicks = tasks.filter(t => t.hold_reason === 'SHORT' || t.hold_reason?.startsWith('SHORT')).length;
    const pending = tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length;

    const newStatus = pending === 0 ? 'COMPLETED' : 'PARTIALLY_COMPLETE';

    await this.prisma.picking_waves.updateMany({
      where: { tenant_id: tenantId, wave_id: waveId },
      data: {
        status: newStatus,
        completed_tasks: completedTasks,
        total_tasks: totalTasks,
      },
    });

    if (newStatus === 'COMPLETED') {
      await this.prisma.picking_waves.updateMany({
        where: { tenant_id: tenantId, wave_id: waveId },
        data: { completed_at: new Date() },
      });
    }

    return { totalTasks, completedTasks, shortPicks, pending, newStatus };
  }

  // APP-PICK-J: Write pick audit log entry
  private async writePickAudit(tenantId: string, taskId: bigint, eventType: string, refCode?: string | null, userId?: string | null, extra?: any) {
    try {
      const task = extra?.task || await this.prisma.picking_tasks.findFirst({
        where: { tenant_id: tenantId, task_id: taskId },
        select: { from_location_id: true, product_id: true, quantity_picked: true, quantity_to_pick: true },
      });
      await this.prisma.pick_audit_log.create({
        data: {
          tenant_id: tenantId,
          task_id: taskId,
          from_location_id: task?.from_location_id || null,
          product_id: task?.product_id || null,
          qty_picked: task?.quantity_picked || null,
          qty_remaining: task?.quantity_to_pick || null,
          event_type: eventType,
          notes: refCode || (extra ? JSON.stringify(extra) : null),
          recorded_by: userId || null,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to write pick audit: ${err.message}`);
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

    if (task.wave_id) {
      await this.checkWaveCompletion(tenantId, task.wave_id);
    }

    return this.findTaskById(tenantId, BigInt(taskId));
  }

  /** Cancel task with Manhattan structured reason code (APP-PICK-L: inventory restoration) */
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

    // APP-PICK-L: Restore inventory if any quantity was already picked
    const pickedQty = Number(task.quantity_picked || 0);
    if (pickedQty > 0 && task.from_location_id) {
      await this.prisma.inventory_on_hand.updateMany({
        where: { tenant_id: tenantId, facility_id: task.facility_id, product_id: task.product_id, location_id: task.from_location_id },
        data: { quantity_on_hand: { increment: pickedQty } },
      });
      await this.prisma.inventory_transactions.create({
        data: {
          tenant_id: tenantId,
          facility_id: task.facility_id,
          reference_type: 'PICKING_TASK',
          reference_id: task.task_id,
          product_id: task.product_id,
          from_location_id: null,
          to_location_id: task.from_location_id,
          transaction_type: 'RETURN',
          transaction_status: 'COMPLETED',
          quantity: pickedQty,
          uom_id: task.uom_id,
          reason_code: 'CANCELLATION_RESTORE',
          notes: `Inventory restored from cancelled pick task ${taskId}`,
        },
      });
    }

    await this.prisma.picking_tasks.updateMany({
      where: { tenant_id: tenantId, task_id: BigInt(taskId) },
      data: {
        status: 'CANCELLED',
        hold_reason: validReason,
        updated_by: task.assigned_to_user_id,
      },
    });

    if (task.wave_id) {
      await this.checkWaveCompletion(tenantId, task.wave_id);
    }

    await this.writePickAudit(tenantId, BigInt(taskId), 'TASK_CANCELLED', reason, task.assigned_to_user_id, {
      restoredQty: pickedQty,
    });

    return this.findTaskById(tenantId, BigInt(taskId));
  }

  // GAP-6.1: Get next interleavable task nearest to a location
  async getNextInterleavableTask(tenantId: string, facilityId: bigint, currentLocationId: bigint) {
    const tasks = await this.prisma.picking_tasks.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, status: 'AVAILABLE' },
      orderBy: { priority: 'asc' },
      take: 20,
    });
    if (!tasks.length) return null;

    // Find nearest by location proximity
    let nearest = tasks[0];
    let nearestDist = Infinity;
    for (const t of tasks) {
      if (t.from_location_id) {
        const dist = Number(t.from_location_id) - Number(currentLocationId);
        const absDist = Math.abs(dist);
        if (absDist < nearestDist) {
          nearestDist = absDist;
          nearest = t;
        }
      }
    }

    const risk = await this.validatePrePick(tenantId, nearest.task_id);
    if (risk) return risk;

    return this.findTaskById(tenantId, nearest.task_id);
  }

  // Web: Get wave tasks with task details
  async getWaveTasks(tenantId: string, waveId: bigint) {
    const tasks = await this.prisma.picking_tasks.findMany({
      where: { tenant_id: tenantId, wave_id: waveId },
      orderBy: [{ priority: 'asc' }, { task_id: 'asc' }],
    });
    return Promise.all(tasks.map(t => this.findTaskById(tenantId, t.task_id)));
  }

  // Web: List backorders
  async listBackorders(tenantId: string, facilityId?: bigint) {
    const where: any = { tenant_id: tenantId };
    if (facilityId) {
      const lines = await this.prisma.sales_order_lines.findMany({
        where: { tenant_id: tenantId, facility_id: facilityId },
        select: { line_id: true },
      });
      where.order_line_id = { in: lines.map(l => l.line_id) };
    }
    return this.prisma.backorder_records.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  // APP-PICK-I: Auto-unassign expired/abandoned tasks
  async autoUnassignExpiredTasks(tenantId: string, facilityId: bigint) {
    const expiredMinutes = 30; // tasks not updated in 30 min → release
    const cutoff = new Date(Date.now() - expiredMinutes * 60 * 1000);
    const result = await this.prisma.picking_tasks.updateMany({
      where: {
        tenant_id: tenantId,
        facility_id: facilityId,
        status: 'ASSIGNED',
        updated_at: { lt: cutoff },
      },
      data: {
        status: 'AVAILABLE',
        assigned_to_user_id: null,
        hold_reason: 'SESSION_EXPIRED',
      },
    });
    if (result.count > 0) {
      this.logger.log(`Auto-unassigned ${result.count} expired tasks in facility ${facilityId}`);
    }
    return { releasedCount: result.count };
  }

  // GAP-2.1: Create batch pick session (service layer)
  async createBatchPick(tenantId: string, dto: any) {
    const waveId = BigInt(dto.wave_id);
    const wave = await this.prisma.picking_waves.findFirst({
      where: { tenant_id: tenantId, wave_id: waveId },
    });
    if (!wave) throw new BadRequestException('Wave not found');
    if (wave.status !== 'RELEASED') throw new BadRequestException('Wave must be RELEASED to start batch');

    // Group tasks by product SKU across all orders in the wave
    const tasks = await this.prisma.picking_tasks.findMany({
      where: { tenant_id: tenantId, wave_id: waveId, status: 'AVAILABLE' },
      orderBy: { product_id: 'asc' },
    });

    const batches: Record<string, typeof tasks> = {};
    for (const task of tasks) {
      const key = `${task.product_id}`;
      if (!batches[key]) batches[key] = [];
      batches[key].push(task);
    }

    const batch = await this.prisma.pick_batch_sessions.create({
      data: {
        tenant_id: tenantId,
        wave_id: waveId,
        status: dto.status || 'CREATED',
        created_by: dto.created_by,
      },
    });

    return {
      batchId: batch.batch_id.toString(),
      waveId: waveId.toString(),
      groupedSKUs: Object.keys(batches).length,
      totalTasks: tasks.length,
      batch,
    };
  }

  // APP-PICK-M: Resume pick session — return last known state
  async resumePickSession(tenantId: string, userId: string, facilityId: bigint) {
    const session = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT * FROM multitenant.db_rf_sessions
       WHERE tenant_id = $1::uuid AND user_id = $2::uuid AND status = 'ACTIVE'
       ORDER BY last_activity_at DESC LIMIT 1`,
      tenantId, userId,
    ).then(r => r[0] || null);

    if (!session) {
      // No active session; just return active tasks
      return { tasks: await this.myTasks(tenantId, userId, facilityId), session: null };
    }

    const currentTasks = await this.myTasks(tenantId, userId, facilityId);
    const pickState = session.pick_state_json || {};
    const lastTaskId = pickState.currentTaskId || null;

    let currentTask: any = null;
    if (lastTaskId) {
      currentTask = await this.findTaskById(tenantId, BigInt(lastTaskId));
    }

    return {
      tasks: currentTasks,
      currentTask,
      lastStep: pickState.lastStep || null,
      sessionId: session.id,
      session,
    };
  }

  // APP-PICK-M: Save pick state to RF session
  async savePickState(tenantId: string, userId: string, state: any) {
    await this.prisma.$executeRawUnsafe(
      `UPDATE multitenant.db_rf_sessions
       SET pick_state_json = $3::jsonb, last_activity_at = NOW()
       WHERE tenant_id = $1::uuid AND user_id = $2::uuid AND status = 'ACTIVE'`,
      tenantId, userId, JSON.stringify(state),
    );
    return { saved: true };
  }
}
