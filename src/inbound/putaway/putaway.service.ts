import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { task_status_old } from '@prisma/client';

interface NamedTask {
  facility_name: string | null;
  product_name: string | null;
  uom_name: string | null;
  from_location_name: string | null;
  to_location_name: string | null;
}

@Injectable()
export class PutawayService {
  private readonly logger = new Logger(PutawayService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createTask(tenantId: string, dto: any) {
    const task = await this.prisma.putaway_tasks.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        task_number: dto.task_number,
        task_name: dto.task_name,
        description: dto.description,
        receipt_line_id: dto.receipt_line_id ? BigInt(dto.receipt_line_id) : undefined,
        receipt_item_id: dto.receipt_item_id ? BigInt(dto.receipt_item_id) : undefined,
        product_id: BigInt(dto.product_id),
        lot_id: dto.lot_id ? BigInt(dto.lot_id) : undefined,
        quantity: dto.quantity,
        uom_id: BigInt(dto.uom_id),
        from_location_id: BigInt(dto.from_location_id),
        to_location_id: dto.to_location_id ? BigInt(dto.to_location_id) : undefined,
        priority: dto.priority || 10,
        due_date: dto.due_date ? new Date(dto.due_date) : undefined,
        notes: dto.notes,
        lot_number: dto.lot_number,
        suggested_location_barcode: dto.suggested_location_barcode,
        grn_number: dto.grn_number,
        lpn_barcode: dto.lpn_barcode,
      },
    });
    return this.enrichTaskWithNames(task);
  }

  async findAllTasks(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.status) where.status = query.status;
    if (query.assignedToUserId) where.assigned_to_user_id = query.assignedToUserId;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.putaway_tasks.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: [{ priority: 'asc' }, { created_at: 'asc' }],
      }),
      this.prisma.putaway_tasks.count({ where }),
    ]);
    return { data: await this.enrichTasksWithNames(data), total, page, limit };
  }

  async delete(tenantId: string, taskId: bigint) {
    return this.prisma.putaway_tasks.deleteMany({ where: { tenant_id: tenantId, task_id: taskId } });
  }

  async findTaskById(tenantId: string, taskId: bigint) {
    const task = await this.prisma.putaway_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    return this.enrichTaskWithNames(task);
  }

  async nextTask(tenantId: string, facilityId: bigint) {
    const task = await this.prisma.putaway_tasks.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, status: 'PENDING' },
      orderBy: [{ priority: 'asc' }, { created_at: 'asc' }],
    });
    return this.enrichTaskWithNames(task);
  }

  async findTaskByLpn(tenantId: string, facilityId: bigint, lpnBarcode: string) {
    const lpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, lpn_number: lpnBarcode },
    });
    if (!lpn) throw new BadRequestException(`LPN ${lpnBarcode} not found`);
    if (lpn.status !== 'PUTAWAY_PENDING') {
      throw new BadRequestException(`LPN ${lpnBarcode} status is ${lpn.status}, must be PUTAWAY_PENDING`);
    }
    const task = await this.prisma.putaway_tasks.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, lpn_barcode: lpnBarcode, status: { not: 'COMPLETED' } },
    });
    return this.enrichTaskWithNames(task);
  }

  async startTask(tenantId: string, taskId: bigint) {
    const task = await this.prisma.putaway_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    if (!task) throw new BadRequestException('Task not found');
    if (task.status !== task_status_old.PENDING && task.status !== task_status_old.ASSIGNED) {
      throw new BadRequestException('Task must be PENDING or ASSIGNED to start');
    }
    // Use update() (not updateMany) — updateMany has a bug with PG enum types
    await this.prisma.putaway_tasks.update({
      where: { task_id: taskId },
      data: { status: task_status_old.IN_PROGRESS },
    });
    return { updated: 1, status: 'IN_PROGRESS' };
  }

  async assignTask(tenantId: string, taskId: bigint, userId: string) {
    const task = await this.prisma.putaway_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    if (!task) throw new BadRequestException('Task not found');
    if (task.status !== task_status_old.PENDING) {
      throw new BadRequestException('Task must be in PENDING status to assign');
    }
    // Use update() (not updateMany) — updateMany has a bug with PG enum types
    await this.prisma.putaway_tasks.update({
      where: { task_id: taskId },
      data: { assigned_to_user_id: userId, status: task_status_old.ASSIGNED },
    });
    return { updated: 1, status: 'ASSIGNED' };
  }

  /** GAP-1: Location Full Exception - flag location as full, find alternate */
  async locationFullException(tenantId: string, taskId: bigint, userId: string) {
    const task = await this.prisma.putaway_tasks.findFirst({ where: { tenant_id: tenantId, task_id: taskId } });
    if (!task) throw new BadRequestException('Task not found');
    if (task.to_location_id) {
      await this.prisma.location_exceptions.create({
        data: { tenant_id: tenantId, location_id: task.to_location_id, exception_type: 'FULL', reported_by: userId, reported_at: new Date() },
      });
      await this.prisma.storage_locations.updateMany({
        where: { tenant_id: tenantId, location_id: task.to_location_id },
        data: { is_blocked: true, block_reason: 'Putaway reported full' },
      });
    }
    const alt = await this.suggestLocation(tenantId, task.facility_id, task.product_id, undefined, task.from_location_id, false);
    if (!alt) throw new BadRequestException('No alternate location available');
    // Use update() for the task update
    await this.prisma.putaway_tasks.update({
      where: { task_id: taskId },
      data: { to_location_id: BigInt(alt.locationId), suggested_location_barcode: alt.locationCode, notes: `Alt from full: ${alt.locationCode}` },
    });
    return { ...alt, locationTier: 'OVERFLOW' };
  }

  /** GAP-2: Report damage during putaway movement */
  async reportDamage(tenantId: string, taskId: bigint, dto: any) {
    const task = await this.prisma.putaway_tasks.findFirst({ where: { tenant_id: tenantId, task_id: taskId } });
    if (!task) throw new BadRequestException('Task not found');
    const rec = await this.prisma.putaway_damage_records.create({
      data: {
        tenant_id: tenantId, facility_id: task.facility_id, task_id: taskId,
        damage_code_id: dto.damageCodeId ? BigInt(dto.damageCodeId) : undefined,
        damage_quantity: dto.damageQuantity || 0, lpn_barcode: task.lpn_barcode,
        product_id: task.product_id, notes: dto.notes, reported_by: dto.userId, reported_at: new Date(),
      },
    });
    if (task.lpn_barcode && dto.damageQuantity > 0) {
      await this.prisma.license_plate_numbers.updateMany({
        where: { tenant_id: tenantId, facility_id: task.facility_id, lpn_number: task.lpn_barcode },
        data: { status: 'IN_QC', updated_at: new Date() },
      });
    }
    return this.enrichDamageRecordWithNames(rec);
  }

  /**
   * Suggest putaway location using Manhattan-style rules:
   * 1. Product-specific fixed location (product_id match on putaway_rules)
   * 2. APP-PUT-C: Velocity-based slotting (ABC class + velocity_class_filter)
   * 3. APP-PUT-D: Forward pick vs reserve by location_type_preference
   * 4. GAP-3: Weight AND Volume capacity checks
   * 5. FEFO routing if expiry-sensitive
   * 6. GAP-4: Overflow rule fallback
   * 7. Nearest-empty to staging area
   * 8. Fallback
   */
  private async getProductCapacity(tenantId: string, productId: bigint) {
    const prod = await this.prisma.products.findFirst({ where: { tenant_id: tenantId, product_id: productId } });
    return {
      unitWeight: prod?.weight ? Number(prod.weight) : 1,
      unitVolume: prod?.volume ? Number(prod.volume) : 0,
      abcClass: prod?.abc_analysis_class || 'C',
    };
  }

  private async checkLocationCapacity(location: any, tenantId: string, productId: bigint, incomingQty: number) {
    const cap = await this.getProductCapacity(tenantId, productId);
    const onHand = await this.prisma.inventory_on_hand.aggregate({
      where: { tenant_id: tenantId, location_id: location.location_id },
      _sum: { quantity_on_hand: true },
    });
    const currentQty = Number(onHand._sum?.quantity_on_hand || 0);
    const currentWeight = currentQty * cap.unitWeight;
    const incomingWeight = incomingQty * cap.unitWeight;
    const currentVolume = currentQty * cap.unitVolume;
    const incomingVolume = incomingQty * cap.unitVolume;
    const weightOk = !location.max_weight || (currentWeight + incomingWeight) <= Number(location.max_weight);
    const volumeOk = !location.max_volume || (currentVolume + incomingVolume) <= Number(location.max_volume);
    return { ok: weightOk && volumeOk, currentQty, currentWeight, currentVolume, ...cap };
  }

  private async matchRulesWithCapacity(
    rules: any[], candidates: any[], tenantId: string, productId: bigint, incomingQty: number,
    fromLocationId?: bigint, skipRuleIds?: Set<bigint>,
  ) {
    for (const rule of rules) {
      if (skipRuleIds?.has(rule.rule_id)) continue;
      const matched = candidates.filter((loc: any) => {
        if (loc.is_reserved && loc.reserved_product_id && loc.reserved_product_id !== productId) return false;
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
      if (!matched.length) continue;
      const sorted = fromLocationId ? await this.sortByProximity(tenantId, fromLocationId, matched) : matched;
      for (const loc of sorted) {
        const cap = await this.checkLocationCapacity(loc, tenantId, productId, incomingQty);
        if (cap.ok) {
          return {
            locationId: loc.location_id.toString(), locationCode: loc.location_code,
            locationType: loc.location_type, checkDigit: loc.barcode_value || loc.location_code,
            zoneId: loc.zone_id?.toString(), ruleCode: rule.rule_code, ruleName: rule.rule_name,
            locationTier: loc.location_tier || 'PRIMARY', velocityClass: rule.velocity_class_filter?.[0],
          };
        }
      }
    }
    return null;
  }

  async suggestLocation(
    tenantId: string, facilityId: bigint, productId: bigint, categoryId?: bigint,
    fromLocationId?: bigint, hasExpiry?: boolean, incomingQty: number = 1,
  ): Promise<any> {
    const rules = await this.prisma.putaway_rules.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, is_active: true },
      orderBy: { priority: 'asc' },
    });
    const candidates = await this.prisma.storage_locations.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, is_active: true, is_blocked: false, is_reserved: false },
      orderBy: { location_code: 'asc' },
    });
    if (!candidates.length) return null;

    const prodInfo = await this.getProductCapacity(tenantId, productId);
    const skipIds = new Set<bigint>();

    // APP-PUT-C: Filter rules by velocity class matching product ABC class
    const relevantRules = rules.filter((r: any) => !r.velocity_class_filter?.length || r.velocity_class_filter.includes(prodInfo.abcClass));

    // Step 1: Product-specific fixed location (highest priority)
    const productRule = relevantRules.find((r: any) => r.product_id && r.product_id === productId);
    if (productRule?.fixed_location_code) {
      skipIds.add(productRule.rule_id);
      const fixed = candidates.find((l: any) => l.location_code === productRule.fixed_location_code);
      if (fixed) {
        const cap = await this.checkLocationCapacity(fixed, tenantId, productId, incomingQty);
        if (cap.ok) {
          return { locationId: fixed.location_id.toString(), locationCode: fixed.location_code, locationType: fixed.location_type, checkDigit: fixed.barcode_value || fixed.location_code, ruleCode: productRule.rule_code, ruleName: productRule.rule_name, locationTier: fixed.location_tier || 'PRIMARY', velocityClass: productRule.velocity_class_filter?.[0] };
        }
        // GAP-4: Fixed location full → check overflow rule
        if (productRule.is_overflow_rule && productRule.parent_rule_id) {
          const parentRule = rules.find((r: any) => r.rule_id === productRule.parent_rule_id);
          if (parentRule) {
            const overflow = parentRule.fixed_location_code ? candidates.find((l: any) => l.location_code === parentRule.fixed_location_code) : null;
            if (overflow) {
              const capO = await this.checkLocationCapacity(overflow, tenantId, productId, incomingQty);
              if (capO.ok) return { locationId: overflow.location_id.toString(), locationCode: overflow.location_code, locationType: overflow.location_type, checkDigit: overflow.barcode_value || overflow.location_code, ruleCode: parentRule.rule_code, ruleName: `${parentRule.rule_name} (OVERFLOW)`, locationTier: 'OVERFLOW' };
            }
          }
        }
      }
    }

    // Step 2: FEFO routing (expiry-sensitive products)
    if (hasExpiry) {
      const fefoRules = relevantRules.filter((r: any) => r.rotation_logic === 'FEFO' || r.rotation_logic === 'FIFO');
      for (const rule of fefoRules) {
        skipIds.add(rule.rule_id);
        const r = await this.matchRulesWithCapacity([rule], candidates, tenantId, productId, incomingQty, fromLocationId);
        if (r) return { ...r, ruleName: `${r.ruleName} (${rule.rotation_logic})` };
      }
    }

    // Step 3: Remaining rules in priority order
    const regular = await this.matchRulesWithCapacity(relevantRules, candidates, tenantId, productId, incomingQty, fromLocationId, skipIds);
    if (regular) return regular;

    // Step 4: Overflow rules (GAP-4)
    const overflowRules = relevantRules.filter((r: any) => r.is_overflow_rule && !skipIds.has(r.rule_id));
    if (overflowRules.length) {
      const or = await this.matchRulesWithCapacity(overflowRules, candidates, tenantId, productId, incomingQty, fromLocationId);
      if (or) return { ...or, locationTier: 'OVERFLOW' };
    }

    // Step 5: Fallback — nearest available with capacity
    const fallback = fromLocationId ? await this.sortByProximity(tenantId, fromLocationId, candidates) : candidates;
    for (const loc of fallback) {
      const cap = await this.checkLocationCapacity(loc, tenantId, productId, incomingQty);
      if (cap.ok) return { locationId: loc.location_id.toString(), locationCode: loc.location_code, locationType: loc.location_type, checkDigit: loc.barcode_value || loc.location_code, ruleCode: 'FALLBACK', ruleName: 'Nearest available', locationTier: loc.location_tier || 'PRIMARY' };
    }
    return null;
  }

  private async sortByProximity(tenantId: string, fromLocationId: bigint, locations: any[]) {
    const stagingLoc = await this.prisma.storage_locations.findFirst({ where: { tenant_id: tenantId, location_id: fromLocationId } });
    if (!stagingLoc?.zone_id) return locations;
    return locations.sort((a: any, b: any) => (a.zone_id === stagingLoc.zone_id ? 0 : 1) - (b.zone_id === stagingLoc.zone_id ? 0 : 1));
  }

  /**
   * Complete putaway: record completion, update inventory at source/destination,
   * create inventory transaction, update LPN status, record operator time.
   * GAP-2.1: Accepts damageCodeId/damageQuantity for damage during movement.
   */
  async completeTask(tenantId: string, taskId: bigint, dto: any) {
    const task = await this.prisma.putaway_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    if (!task) throw new BadRequestException('Task not found');
    if (task.status !== task_status_old.ASSIGNED && task.status !== task_status_old.IN_PROGRESS) {
      throw new BadRequestException('Task must be ASSIGNED or IN_PROGRESS to complete');
    }

    const toLocationId = dto.to_location_id ? BigInt(dto.to_location_id) : task.to_location_id;
    if (!toLocationId) throw new BadRequestException('Destination location is required');

    // APP-PUT-H: Validate scanned location matches directed (or require override reason)
    if (dto.actual_location_barcode && !dto.override_reason_code) {
      const location = await this.prisma.storage_locations.findFirst({
        where: { tenant_id: tenantId, OR: [{ location_code: dto.actualLocationBarcode }, { barcode_value: dto.actualLocationBarcode }] },
      });
      if (location && location.location_id !== toLocationId) {
        const expectedLoc = await this.prisma.storage_locations.findFirst({ where: { tenant_id: tenantId, location_id: toLocationId } });
        throw new BadRequestException(`Scanned location does not match directed location. Expected: ${expectedLoc?.location_code}. Provide overrideReasonCode to override.`);
      }
    }

    const completedAt = new Date();
    const startedAt = task.created_at;
    const durationSeconds = startedAt ? Math.floor((completedAt.getTime() - new Date(startedAt).getTime()) / 1000) : 0;
    const damageQty = Number(dto.damage_quantity || 0);

    // GAP-2.1: Handle damage during putaway movement
    if (damageQty > 0) {
      await this.prisma.putaway_damage_records.create({
        data: {
          tenant_id: tenantId, facility_id: task.facility_id, task_id: taskId,
          damage_code_id: dto.damage_code_id ? BigInt(dto.damage_code_id) : undefined,
          damage_quantity: damageQty, lpn_barcode: task.lpn_barcode,
          product_id: task.product_id, notes: dto.damage_notes || dto.notes || 'Damaged during putaway',
          reported_by: dto.reported_by || null, reported_at: new Date(),
        },
      });
      if (task.lpn_barcode) {
        await this.prisma.license_plate_numbers.updateMany({
          where: { tenant_id: tenantId, facility_id: task.facility_id, lpn_number: task.lpn_barcode },
          data: { status: 'IN_QC', updated_at: new Date() },
        });
      }
    }

    // Use update() (not updateMany) for enum status change
    await this.prisma.putaway_tasks.update({
      where: { task_id: taskId },
      data: {
        status: task_status_old.COMPLETED,
        completed_at: completedAt,
        to_location_id: toLocationId,
        actual_location_barcode: dto.actual_location_barcode || undefined,
        override_reason_code: dto.override_reason_code || undefined,
        notes: dto.notes || undefined,
      },
    });

    const qty = Number(task.quantity);
    const qtyGood = Math.max(0, qty - damageQty);

    if (qtyGood <= 0) {
      return { durationSeconds, damageQty };
    }

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
        data: { quantity_on_hand: { increment: qtyGood } },
      });
    } else {
      await this.prisma.inventory_on_hand.create({
        data: { tenant_id: tenantId, facility_id: task.facility_id, product_id: task.product_id, location_id: toLocationId, uom_id: task.uom_id, quantity_on_hand: qtyGood },
      });
    }

    await this.prisma.inventory_transactions.create({
      data: {
        tenant_id: tenantId, facility_id: task.facility_id, reference_type: 'PUTAWAY', reference_id: task.task_id,
        product_id: task.product_id, from_location_id: task.from_location_id, to_location_id: toLocationId,
        transaction_type: 'PUTAWAY', transaction_status: 'COMPLETED', quantity: qtyGood, uom_id: task.uom_id,
        lot_number: task.lot_number,         reason_code: dto.override_reason_code || 'STANDARD',
        reference_document_type: 'GRN', reference_document_number: task.grn_number,
      },
    });

    // Manhattan: update LPN status after putaway
    if (task.lpn_barcode) {
      if (damageQty > 0) {
        // LPN already set to IN_QC by damage handling above — keep status, just update location
        await this.prisma.license_plate_numbers.updateMany({
          where: { tenant_id: tenantId, facility_id: task.facility_id, lpn_number: task.lpn_barcode },
          data: { location_id: toLocationId, updated_at: new Date() },
        });
      } else {
        await this.prisma.license_plate_numbers.updateMany({
          where: { tenant_id: tenantId, facility_id: task.facility_id, lpn_number: task.lpn_barcode },
          data: { status: 'STORED', location_id: toLocationId, staging_location_id: null, updated_at: new Date() },
        });
      }
    }

    return { durationSeconds, damageQty };
  }

  /** APP-PUT-H: Validate scanned location with scan-time rejection */
  async validateLocation(tenantId: string, facilityId: bigint, taskId: bigint, locationBarcode: string) {
    const task = await this.prisma.putaway_tasks.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, task_id: taskId },
    });
    if (!task) throw new BadRequestException('Task not found');
    const location = await this.prisma.storage_locations.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, OR: [{ location_code: locationBarcode }, { barcode_value: locationBarcode }] },
    });
    if (!location) throw new BadRequestException('Location not found for scanned barcode');
    const expectedCode = task.to_location_id
      ? (await this.prisma.storage_locations.findFirst({ where: { tenant_id: tenantId, location_id: task.to_location_id } }))?.location_code
      : task.suggested_location_barcode;
    if (expectedCode && location.location_code !== expectedCode) {
      throw new BadRequestException(`WRONG LOCATION — Expected: ${expectedCode}, Scanned: ${location.location_code}. Use override reason code to force.`);
    }
    return { valid: true, isExactMatch: true, locationId: location.location_id.toString(), locationCode: location.location_code, barcodeValue: location.barcode_value, expectedCode, taskId: taskId.toString() };
  }

  async confirmPutaway(tenantId: string, dto: any) {
    return this.completeTask(tenantId, BigInt(dto.taskId), dto);
  }

  async findTasksByGrn(tenantId: string, grnNumber: string) {
    const tasks = await this.prisma.putaway_tasks.findMany({ where: { tenant_id: tenantId, grn_number: grnNumber }, orderBy: { priority: 'asc' } });
    return this.enrichTasksWithNames(tasks);
  }

  private async enrichTasksWithNames(tasks: any[]): Promise<any[]> {
    if (!tasks.length) return tasks;
    const tenantId = tasks[0].tenant_id;
    const facilityIds = [...new Set(tasks.map(t => t.facility_id).filter(Boolean))];
    const productIds = [...new Set(tasks.map(t => t.product_id).filter(Boolean))];
    const lotIds = [...new Set(tasks.map(t => t.lot_id).filter(Boolean))];
    const uomIds = [...new Set(tasks.map(t => t.uom_id).filter(Boolean))];
    const fromLocIds = [...new Set(tasks.map(t => t.from_location_id).filter(Boolean))];
    const toLocIds = [...new Set(tasks.map(t => t.to_location_id).filter(Boolean))];
    const allLocationIds = [...new Set([...fromLocIds, ...toLocIds])];
    const [facilities, products, lots, uoms, locations] = await Promise.all([
      facilityIds.length ? this.prisma.warehouse_facilities.findMany({ where: { tenant_id: tenantId, facility_id: { in: facilityIds } } }) : [],
      productIds.length ? this.prisma.products.findMany({ where: { tenant_id: tenantId, product_id: { in: productIds } } }) : [],
      lotIds.length ? this.prisma.inventory_lots.findMany({ where: { tenant_id: tenantId, lot_id: { in: lotIds } } }) : [],
      uomIds.length ? this.prisma.units_of_measure.findMany({ where: { tenant_id: tenantId, uom_id: { in: uomIds } } }) : [],
      allLocationIds.length ? this.prisma.storage_locations.findMany({ where: { tenant_id: tenantId, location_id: { in: allLocationIds } } }) : [],
    ]) as [any[], any[], any[], any[], any[]];
    const facMap = new Map<string, string>();
    facilities.forEach(f => facMap.set(String(f.facility_id), f.facility_name));
    const prodMap = new Map<string, string>();
    products.forEach(p => prodMap.set(String(p.product_id), p.product_name));
    const lotMap = new Map<string, string>();
    lots.forEach(l => lotMap.set(String(l.lot_id), l.lot_number));
    const uomMap = new Map<string, string>();
    uoms.forEach(u => uomMap.set(String(u.uom_id), u.uom_name));
    const locMap = new Map<string, string>();
    locations.forEach(l => locMap.set(String(l.location_id), l.location_name));
    return tasks.map(t => ({
      ...t,
      facility_name: facMap.get(String(t.facility_id)) ?? null,
      product_name: prodMap.get(String(t.product_id)) ?? null,
      lot_number: lotMap.get(String(t.lot_id)) ?? t.lot_number,
      uom_name: uomMap.get(String(t.uom_id)) ?? null,
      from_location_name: locMap.get(String(t.from_location_id)) ?? null,
      to_location_name: locMap.get(String(t.to_location_id)) ?? null,
    }));
  }

  private async enrichTaskWithNames(task: any): Promise<any> {
    if (!task) return task;
    const [tasks] = await this.enrichTasksWithNames([task]);
    return tasks;
  }

  private async enrichDamageRecordWithNames(rec: any): Promise<any> {
    if (!rec) return rec;
    const tenantId = rec.tenant_id;
    const facility = rec.facility_id ? await this.prisma.warehouse_facilities.findFirst({ where: { tenant_id: tenantId, facility_id: rec.facility_id } }) : null;
    const damageCode = rec.damage_code_id ? await this.prisma.damage_codes.findFirst({ where: { tenant_id: tenantId, damage_code_id: rec.damage_code_id } }) : null;
    const product = rec.product_id ? await this.prisma.products.findFirst({ where: { tenant_id: tenantId, product_id: rec.product_id } }) : null;
    return {
      ...rec,
      facility_name: facility?.facility_name ?? null,
      damage_code_name: damageCode?.description ?? null,
      product_name: product?.product_name ?? null,
    };
  }
}
