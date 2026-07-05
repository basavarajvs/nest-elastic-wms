import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { task_status_old } from '@prisma/client';

@Injectable()
export class PutawayService {
  private readonly logger = new Logger(PutawayService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createTask(tenantId: string, dto: any) {
    return this.prisma.putaway_tasks.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        task_number: dto.taskNumber,
        task_name: dto.taskName,
        description: dto.description,
        receipt_line_id: dto.receiptLineId ? BigInt(dto.receiptLineId) : undefined,
        receipt_item_id: dto.receiptItemId ? BigInt(dto.receiptItemId) : undefined,
        product_id: BigInt(dto.productId),
        quantity: dto.quantity,
        uom_id: BigInt(dto.uomId),
        from_location_id: BigInt(dto.fromLocationId),
        to_location_id: dto.toLocationId ? BigInt(dto.toLocationId) : undefined,
        priority: dto.priority || 10,
        due_date: dto.dueDate ? new Date(dto.dueDate) : undefined,
        notes: dto.notes,
        lot_number: dto.lotNumber,
        suggested_location_barcode: dto.suggestedLocationBarcode,
        grn_number: dto.grnNumber,
        lpn_barcode: dto.lpnBarcode,
      },
    });
  }

  async findAllTasks(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.status) where.status = query.status;
    if (query.assignedToUserId) where.assigned_to_user_id = query.assignedToUserId;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.putaway_tasks.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ priority: 'asc' }, { created_at: 'asc' }],
      }),
      this.prisma.putaway_tasks.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async delete(tenantId: string, taskId: bigint) {
    return this.prisma.putaway_tasks.deleteMany({
      where: { tenant_id: tenantId, task_id: taskId },
    });
  }

  async findTaskById(tenantId: string, taskId: bigint) {
    return this.prisma.putaway_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
    });
  }

  /** Find the next unassigned high-priority task for a user (RF) */
  async nextTask(tenantId: string, facilityId: bigint) {
    const task = await this.prisma.putaway_tasks.findFirst({
      where: {
        tenant_id: tenantId,
        facility_id: facilityId,
        status: task_status_old.PENDING,
      },
      orderBy: [{ priority: 'asc' }, { created_at: 'asc' }],
    });
    return task;
  }

  /** Lookup putaway task by scanning LPN barcode (RF) */
  async findTaskByLpn(tenantId: string, facilityId: bigint, lpnBarcode: string) {
    const task = await this.prisma.putaway_tasks.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, lpn_barcode: lpnBarcode, status: { not: task_status_old.COMPLETED } },
    });
    if (!task) {
      // Check by suggested_location_barcode as well
      const taskByLoc = await this.prisma.putaway_tasks.findFirst({
        where: { tenant_id: tenantId, facility_id: facilityId, suggested_location_barcode: lpnBarcode, status: { not: task_status_old.COMPLETED } },
      });
      return taskByLoc;
    }
    return task;
  }

  /** RF: start working on a task — set IN_PROGRESS */
  async startTask(tenantId: string, taskId: bigint) {
    const task = await this.prisma.putaway_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    if (!task) throw new BadRequestException('Task not found');
    if (task.status !== task_status_old.PENDING && task.status !== task_status_old.ASSIGNED) {
      throw new BadRequestException('Task must be PENDING or ASSIGNED to start');
    }
    return this.prisma.putaway_tasks.updateMany({
      where: { tenant_id: tenantId, task_id: taskId },
      data: { status: task_status_old.IN_PROGRESS },
    });
  }

  async assignTask(tenantId: string, taskId: bigint, userId: string) {
    const task = await this.prisma.putaway_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    if (!task) throw new BadRequestException('Task not found');
    if (task.status !== task_status_old.PENDING) {
      throw new BadRequestException('Task must be in PENDING status to assign');
    }
    return this.prisma.putaway_tasks.updateMany({
      where: { tenant_id: tenantId, task_id: taskId },
      data: { assigned_to_user_id: userId, status: task_status_old.ASSIGNED },
    });
  }

  /**
   * Suggest putaway location using Manhattan-style rules:
   * 1. Product-specific fixed location (product_id match on putaway_rules)
   * 2. Zone-based with capacity check
   * 3. Location type preference
   * 4. FEFO routing if expiry-sensitive
   * 5. Nearest-empty to staging area
   * 6. Fallback
   */
  async suggestLocation(
    tenantId: string,
    facilityId: bigint,
    productId: bigint,
    categoryId?: bigint,
    fromLocationId?: bigint,
    hasExpiry?: boolean,
  ): Promise<any> {
    const rules = await this.prisma.putaway_rules.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, is_active: true },
      orderBy: { priority: 'asc' },
    });

    const candidates = await this.prisma.storage_locations.findMany({
      where: {
        tenant_id: tenantId,
        facility_id: facilityId,
        is_active: true,
        is_blocked: false,
        is_reserved: false,
      },
      orderBy: { location_code: 'asc' },
    });

    if (candidates.length === 0) return null;

    // First check for product-specific rule (highest priority)
    const productRule = rules.find((r) => r.product_id && r.product_id === productId);
    if (productRule && productRule.fixed_location_code) {
      const fixed = candidates.find((l) => l.location_code === productRule.fixed_location_code);
      if (fixed) {
        const onHand = await this.prisma.inventory_on_hand.aggregate({
          where: { tenant_id: tenantId, location_id: fixed.location_id },
          _sum: { quantity_on_hand: true },
        });
        const currentQty = Number(onHand._sum?.quantity_on_hand || 0);
        if (!fixed.max_weight || currentQty < Number(fixed.max_weight)) {
          return {
            locationId: fixed.location_id.toString(),
            locationCode: fixed.location_code,
            locationType: fixed.location_type,
            checkDigit: fixed.barcode_value || fixed.location_code,
            ruleCode: productRule.rule_code,
            ruleName: productRule.rule_name,
          };
        }
      }
    }

    // FEFO routing: if product has expiry, prefer zones with FEFO rotation
    if (hasExpiry) {
      const fefoRules = rules.filter((r) => r.rotation_logic === 'FEFO' || r.rotation_logic === 'FIFO');
      for (const rule of fefoRules) {
        const matched = candidates.filter((loc) => {
          if (rule.destination_zone_ids_json && loc.zone_id) {
            const zoneIds = JSON.parse(rule.destination_zone_ids_json) as number[];
            if (!zoneIds.includes(Number(loc.zone_id))) return false;
          }
          if (rule.location_type_preference && loc.location_type !== rule.location_type_preference) return false;
          return true;
        });
        if (matched.length > 0) {
          for (const loc of matched) {
            const onHand = await this.prisma.inventory_on_hand.aggregate({
              where: { tenant_id: tenantId, location_id: loc.location_id },
              _sum: { quantity_on_hand: true },
            });
            if (!loc.max_weight || Number(onHand._sum?.quantity_on_hand || 0) < Number(loc.max_weight)) {
              return {
                locationId: loc.location_id.toString(),
                locationCode: loc.location_code,
                locationType: loc.location_type,
                checkDigit: loc.barcode_value || loc.location_code,
                ruleCode: rule.rule_code,
                ruleName: `${rule.rule_name} (${rule.rotation_logic})`,
              };
          }
        }
      }
    }
  }

    // Try remaining rules in priority order
    for (const rule of rules) {
      if (productRule && rule.rule_id === productRule.rule_id) continue;
      if (hasExpiry && (rule.rotation_logic === 'FEFO' || rule.rotation_logic === 'FIFO')) continue;

      const matched = candidates.filter((loc) => {
        if (rule.destination_zone_ids_json && loc.zone_id) {
          const zoneIds = JSON.parse(rule.destination_zone_ids_json) as number[];
          if (!zoneIds.includes(Number(loc.zone_id))) return false;
        }
        if (rule.destination_location_types_json) {
          const types = JSON.parse(rule.destination_location_types_json) as string[];
          if (!types.includes(loc.location_type)) return false;
        }
        if (rule.location_type_preference && loc.location_type !== rule.location_type_preference) return false;
        return true;
      });

      if (matched.length > 0) {
        // Sort by distance to staging area (prefer same zone as staging)
        const sorted = fromLocationId
          ? await this.sortByProximity(tenantId, facilityId, fromLocationId, matched)
          : matched;

        for (const loc of sorted) {
          const onHand = await this.prisma.inventory_on_hand.aggregate({
            where: { tenant_id: tenantId, location_id: loc.location_id },
            _sum: { quantity_on_hand: true },
          });
          if (!loc.max_weight || Number(onHand._sum?.quantity_on_hand || 0) < Number(loc.max_weight)) {
            return {
              locationId: loc.location_id.toString(),
              locationCode: loc.location_code,
              locationType: loc.location_type,
              checkDigit: loc.barcode_value || loc.location_code,
              zoneId: loc.zone_id?.toString(),
              ruleCode: rule.rule_code,
              ruleName: rule.rule_name,
            };
          }
        }
      }
    }

    // Fallback: nearest empty location
    const sortedByProximity = fromLocationId
      ? await this.sortByProximity(tenantId, facilityId, fromLocationId, candidates)
      : candidates;

    for (const loc of sortedByProximity) {
      const onHand = await this.prisma.inventory_on_hand.aggregate({
        where: { tenant_id: tenantId, location_id: loc.location_id },
        _sum: { quantity_on_hand: true },
      });
      if (!loc.max_weight || Number(onHand._sum?.quantity_on_hand || 0) < Number(loc.max_weight)) {
        return {
          locationId: loc.location_id.toString(),
          locationCode: loc.location_code,
          locationType: loc.location_type,
          checkDigit: loc.barcode_value || loc.location_code,
          ruleCode: 'FALLBACK',
          ruleName: 'Nearest available',
        };
      }
    }

    return null;
  }

  private async sortByProximity(tenantId: string, facilityId: bigint, fromLocationId: bigint, locations: any[]) {
    const stagingLoc = await this.prisma.storage_locations.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, location_id: fromLocationId },
    });
    if (!stagingLoc || !stagingLoc.zone_id) return locations;

    return locations.sort((a, b) => {
      const aSameZone = a.zone_id === stagingLoc.zone_id ? 0 : 1;
      const bSameZone = b.zone_id === stagingLoc.zone_id ? 0 : 1;
      return aSameZone - bSameZone;
    });
  }

  /**
   * Complete putaway: record completion, update inventory at source/destination,
   * create inventory transaction, update LPN status, record operator time.
   */
  async completeTask(tenantId: string, taskId: bigint, dto: any) {
    const task = await this.prisma.putaway_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    if (!task) throw new BadRequestException('Task not found');
    if (task.status !== task_status_old.ASSIGNED && task.status !== task_status_old.IN_PROGRESS) {
      throw new BadRequestException('Task must be ASSIGNED or IN_PROGRESS to complete');
    }

    const toLocationId = dto.toLocationId ? BigInt(dto.toLocationId) : task.to_location_id;
    if (!toLocationId) throw new BadRequestException('Destination location is required');

    // Manhattan: validate scanned location matches directed (or require override reason)
    if (dto.actualLocationBarcode && !dto.overrideReasonCode) {
      const location = await this.prisma.storage_locations.findFirst({
        where: {
          tenant_id: tenantId,
          OR: [{ location_code: dto.actualLocationBarcode }, { barcode_value: dto.actualLocationBarcode }],
        },
      });
      if (location && location.location_id !== toLocationId) {
        const expectedLoc = await this.prisma.storage_locations.findFirst({
          where: { tenant_id: tenantId, location_id: toLocationId },
        });
        throw new BadRequestException(
          `Scanned location does not match directed location. Expected: ${expectedLoc?.location_code}. Provide overrideReasonCode to override.`,
        );
      }
    }

    const completedAt = new Date();
    const startedAt = task.created_at;
    const durationSeconds = startedAt
      ? Math.floor((completedAt.getTime() - new Date(startedAt).getTime()) / 1000)
      : 0;

    await this.prisma.putaway_tasks.updateMany({
      where: { tenant_id: tenantId, task_id: taskId },
      data: {
        status: task_status_old.COMPLETED,
        completed_at: completedAt,
        to_location_id: toLocationId,
        actual_location_barcode: dto.actualLocationBarcode,
        override_reason_code: dto.overrideReasonCode,
        notes: dto.notes,
      },
    });

    const qty = Number(task.quantity);

    if (task.from_location_id) {
      await this.prisma.inventory_on_hand.updateMany({
        where: { tenant_id: tenantId, facility_id: task.facility_id, product_id: task.product_id, location_id: task.from_location_id },
        data: { quantity_on_hand: { decrement: qty } },
      });
    }

    const existing = await this.prisma.inventory_on_hand.findFirst({
      where: { tenant_id: tenantId, facility_id: task.facility_id, product_id: task.product_id, location_id: toLocationId },
    });

    if (existing) {
      await this.prisma.inventory_on_hand.updateMany({
        where: { tenant_id: tenantId, facility_id: task.facility_id, product_id: task.product_id, location_id: toLocationId },
        data: { quantity_on_hand: { increment: qty } },
      });
    } else {
      await this.prisma.inventory_on_hand.create({
        data: {
          tenant_id: tenantId,
          facility_id: task.facility_id,
          product_id: task.product_id,
          location_id: toLocationId,
          uom_id: task.uom_id,
          quantity_on_hand: qty,
        },
      });
    }

    await this.prisma.inventory_transactions.create({
      data: {
        tenant_id: tenantId,
        facility_id: task.facility_id,
        reference_type: 'PUTAWAY',
        reference_id: task.task_id,
        product_id: task.product_id,
        from_location_id: task.from_location_id,
        to_location_id: toLocationId,
        transaction_type: 'PUTAWAY',
        transaction_status: 'COMPLETED',
        quantity: qty,
        uom_id: task.uom_id,
        lot_number: task.lot_number,
        reason_code: dto.overrideReasonCode || 'STANDARD',
        reference_document_type: 'GRN',
        reference_document_number: task.grn_number,
      },
    });

    // Manhattan: update LPN status to STORED after putaway
    if (task.lpn_barcode) {
      await this.prisma.license_plate_numbers.updateMany({
        where: { tenant_id: tenantId, facility_id: task.facility_id, lpn_number: task.lpn_barcode },
        data: {
          status: 'STORED',
          location_id: toLocationId,
          staging_location_id: null,
          updated_at: new Date(),
        },
      });
    }

    return {
      ...(await this.findTaskById(tenantId, taskId)),
      durationSeconds,
    };
  }

  /**
   * RF: Validate scanned location matches expected putaway destination.
   * Manhattan: operator scans location barcode, system verifies match (or allowed overflow).
   */
  async validateLocation(tenantId: string, facilityId: bigint, taskId: bigint, locationBarcode: string) {
    const task = await this.prisma.putaway_tasks.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, task_id: taskId },
    });
    if (!task) throw new BadRequestException('Task not found');

    const location = await this.prisma.storage_locations.findFirst({
      where: {
        tenant_id: tenantId,
        facility_id: facilityId,
        OR: [{ location_code: locationBarcode }, { barcode_value: locationBarcode }],
      },
    });
    if (!location) throw new BadRequestException('Location not found for scanned barcode');

    const expectedCode = task.to_location_id
      ? (await this.prisma.storage_locations.findFirst({ where: { tenant_id: tenantId, location_id: task.to_location_id } }))?.location_code
      : task.suggested_location_barcode;

    const isMatch = !expectedCode || location.location_code === expectedCode;
    const allowedOverflow = task.to_location_id && location.zone_id === (
      await this.prisma.storage_locations.findFirst({ where: { tenant_id: tenantId, location_id: task.to_location_id } })
    )?.zone_id;

    return {
      valid: isMatch || allowedOverflow,
      isExactMatch: isMatch,
      isOverflow: allowedOverflow && !isMatch,
      locationId: location.location_id.toString(),
      locationCode: location.location_code,
      barcodeValue: location.barcode_value,
      expectedCode: expectedCode || null,
      taskId: taskId.toString(),
    };
  }

  async confirmPutaway(tenantId: string, dto: any) {
    return this.completeTask(tenantId, BigInt(dto.taskId), dto);
  }

  async findTasksByGrn(tenantId: string, grnNumber: string) {
    return this.prisma.putaway_tasks.findMany({
      where: { tenant_id: tenantId, grn_number: grnNumber },
      orderBy: { priority: 'asc' },
    });
  }
}
