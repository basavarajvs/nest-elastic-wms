import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InspectionService {
  constructor(private readonly prisma: PrismaService) {}

  async lookupLpnForQc(tenantId: string, facilityId: bigint, barcode: string) {
    const lpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, lpn_number: barcode },
    });
    if (!lpn) throw new BadRequestException('LPN not found');
    if (lpn.status !== 'IN_QC') {
      throw new BadRequestException(`LPN status is ${lpn.status}, must be IN_QC for inspection`);
    }
    const product = lpn.product_id
      ? await this.prisma.products.findFirst({ where: { tenant_id: tenantId, product_id: lpn.product_id } })
      : null;
    let receiptInfo: any = null;
    if (lpn.grn_line_id) {
      const grnItem = await this.prisma.goods_receipt_items.findFirst({
        where: { tenant_id: tenantId, receipt_item_id: lpn.grn_line_id },
      });
      if (grnItem) {
        const receiptLine = await this.prisma.goods_receipt_lines.findFirst({
          where: { tenant_id: tenantId, receipt_line_id: grnItem.receipt_line_id },
        });
        if (receiptLine) {
          const receipt = await this.prisma.goods_receipts.findFirst({
            where: { tenant_id: tenantId, receipt_id: receiptLine.receipt_id },
          });
          receiptInfo = { receipt, line: receiptLine, item: grnItem };
        }
      }
    }
    const existingInspections = await this.prisma.quality_inspections.findMany({
      where: {
        tenant_id: tenantId,
        facility_id: facilityId,
        OR: [
          { reference_type: 'LPN', reference_id: lpn.lpn_id },
          { reference_type: 'PRODUCT', reference_id: lpn.product_id || 0 },
        ],
      },
      orderBy: { created_at: 'desc' },
      take: 10,
    });
    return { lpn, product, receiptInfo, existingInspections };
  }

  async create(tenantId: string, dto: any) {
    const inspection = await this.prisma.quality_inspections.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        inspection_number: dto.inspectionNumber,
        inspection_name: dto.inspectionName,
        description: dto.description,
        reference_type: dto.referenceType,
        reference_id: BigInt(dto.referenceId || 0),
        product_id: dto.productId ? BigInt(dto.productId) : null,
        lot_id: dto.lotId ? BigInt(dto.lotId) : undefined,
        inspection_type: dto.inspectionType,
        inspection_scope: dto.inspectionScope,
        sampling_plan_json: dto.samplingPlanJson,
        status: dto.status || 'PENDING',
        assigned_to_user_id: dto.assignedToUserId,
        scheduled_date: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
        notes: dto.notes,
        created_by: dto.createdBy,
      },
    });
    let checklist: any = null;
    if (dto.productId) {
      const mapping = await this.prisma.product_inspection_profiles.findFirst({
        where: { tenant_id: tenantId, product_id: BigInt(dto.productId), is_active: true },
      });
      if (mapping) {
        const profile = await this.prisma.inspection_profiles.findFirst({
          where: { tenant_id: tenantId, profile_id: mapping.profile_id },
        });
        if (profile) {
          const items = await this.prisma.inspection_checklist_items.findMany({
            where: { profile_id: profile.profile_id },
            orderBy: { sort_order: 'asc' },
          });
          checklist = { profile, items };
        }
      }
    }
    return { ...inspection, checklist };
  }

  async findAll(tenantId: string, query: any) {
    const { facilityId, status, referenceType, productId, assignedToUserId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId };
    if (facilityId) where.facility_id = BigInt(facilityId);
    if (status) where.status = status;
    if (referenceType) where.reference_type = referenceType;
    if (productId) where.product_id = BigInt(productId);
    if (assignedToUserId) where.assigned_to_user_id = assignedToUserId;
    const [data, total] = await Promise.all([
      this.prisma.quality_inspections.findMany({ where, skip, take: limit, orderBy: { created_at: 'desc' } }),
      this.prisma.quality_inspections.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: string) {
    const inspection = await this.prisma.quality_inspections.findUnique({
      where: { inspection_id: BigInt(id) },
    });
    if (!inspection) throw new NotFoundException('Inspection not found');
    const results = await this.prisma.quality_inspection_results.findMany({
      where: { tenant_id: tenantId, inspection_id: BigInt(id) },
      orderBy: { created_at: 'desc' },
    });
    const defects = await this.prisma.inspection_defects.findMany({
      where: { inspection_id: BigInt(id) },
    });
    return { ...inspection, results, defects };
  }

  async recordResult(tenantId: string, id: string, dto: any) {
    const inspection = await this.prisma.quality_inspections.findUnique({
      where: { inspection_id: BigInt(id) },
    });
    if (!inspection) throw new NotFoundException('Inspection not found');

    // Create inspection result
    const result = await this.prisma.quality_inspection_results.create({
      data: {
        tenant_id: tenantId,
        facility_id: inspection.facility_id,
        inspection_id: BigInt(id),
        product_id: dto.productId ? BigInt(dto.productId) : BigInt(inspection.product_id || 0),
        lot_id: dto.lotId ? BigInt(dto.lotId) : undefined,
        item_id: dto.itemId ? BigInt(dto.itemId) : undefined,
        result_status: dto.resultStatus,
        failure_reason: dto.failureReason,
        inspection_criteria_results_json: dto.inspectionCriteriaResultsJson,
        notes: dto.notes,
        created_by: dto.createdBy,
      },
    });

    // GAP-2.4: Record structured defects if provided
    if (dto.defects?.length) {
      await this.prisma.inspection_defects.createMany({
        data: dto.defects.map((def: any) => ({
          inspection_id: BigInt(id),
          defect_code_id: BigInt(def.defectCodeId),
          quantity_affected: def.quantityAffected,
          notes: def.notes,
          recorded_by: dto.inspectorUserId || dto.createdBy,
          recorded_at: new Date(),
        })),
      });
    }

    // GAP-4.4: Record temperature if provided
    if (dto.temperatureCelsius !== undefined) {
      await this.prisma.inspection_temperature_logs.create({
        data: {
          inspection_id: BigInt(id),
          reading_celsius: dto.temperatureCelsius,
          acceptable_min: dto.temperatureMin,
          acceptable_max: dto.temperatureMax,
          is_compliant: dto.temperatureCompliant ?? true,
          device_id: dto.temperatureDeviceId,
          logged_at: new Date(),
          logged_by: dto.inspectorUserId || dto.createdBy,
        },
      });
    }

    // Calculate aggregate results
    const totalResults = await this.prisma.quality_inspection_results.count({
      where: { tenant_id: tenantId, inspection_id: BigInt(id) },
    });
    const passedResults = await this.prisma.quality_inspection_results.count({
      where: { tenant_id: tenantId, inspection_id: BigInt(id), result_status: 'PASS' },
    });
    const failedResults = await this.prisma.quality_inspection_results.count({
      where: { tenant_id: tenantId, inspection_id: BigInt(id), result_status: { in: ['FAIL', 'CONDITIONAL'] } },
    });

    // GAP-3: Proper 3-way outcome
    let overallResult: string;
    if (failedResults > 0) {
      const hasFail = await this.prisma.quality_inspection_results.findFirst({
        where: { tenant_id: tenantId, inspection_id: BigInt(id), result_status: 'FAIL' },
      });
      overallResult = hasFail ? 'FAIL' : 'CONDITIONAL';
    } else {
      overallResult = 'PASS';
    }

    // GAP-7: Auto-flag for supervisor review if critical defects exist
    let requiresSupervisorReview = false;
    if (dto.defects?.length) {
      for (const def of dto.defects) {
        const defectCode = await this.prisma.defect_codes.findFirst({
          where: { defect_code_id: BigInt(def.defectCodeId) },
        });
        if (defectCode?.severity === 'CRITICAL') {
          requiresSupervisorReview = true;
          break;
        }
      }
    }
    if (dto.lotMismatch || dto.expiryViolation || dto.temperatureViolation) {
      requiresSupervisorReview = true;
    }

    const newStatus = requiresSupervisorReview ? 'AWAITING_SUPERVISOR_REVIEW' : 'COMPLETED';

    await this.prisma.quality_inspections.update({
      where: { inspection_id: BigInt(id) },
      data: {
        result: overallResult,
        total_items_inspected: totalResults,
        total_passed_items: passedResults,
        total_failed_items: failedResults,
        completed_at: requiresSupervisorReview ? undefined : new Date(),
        status: newStatus,
      },
    });

    await this.prisma.quality_inspection_events.create({
      data: {
        tenant_id: tenantId,
        inspection_id: BigInt(id),
        event_type: requiresSupervisorReview ? 'PENDING_SUPERVISOR_REVIEW' : 'RESULT_RECORDED',
        previous_result: inspection.result,
        new_result: overallResult,
        inspector_user_id: BigInt(0),
        inspector_name: dto.inspectorName,
        reason: dto.reason,
        metadata: dto.metadata || undefined,
      },
    });

    // GAP-3.1: LPN status update with proper 3-way outcome
    if (inspection.reference_type === 'LPN') {
      const lpn = await this.prisma.license_plate_numbers.findFirst({
        where: { tenant_id: tenantId, lpn_id: inspection.reference_id },
      });
      if (lpn) {
        let newLpnStatus: string;
        if (overallResult === 'PASS') {
          // APP-QC-C: On PASS → PUTAWAY_PENDING
          newLpnStatus = 'PUTAWAY_PENDING';
          if (lpn.product_id) {
            await this.prisma.putaway_tasks.create({
              data: {
                tenant_id: tenantId,
                facility_id: inspection.facility_id,
                task_number: `PT-QC-${inspection.inspection_number}-${Date.now()}`,
                product_id: lpn.product_id,
                quantity: 1,
                uom_id: BigInt(dto.uomId || 1),
                from_location_id: lpn.location_id || BigInt(1),
                priority: 10,
                lpn_barcode: lpn.lpn_number,
                status: 'PENDING',
                created_date: new Date(),
              },
            });
          }
        } else if (overallResult === 'CONDITIONAL') {
          newLpnStatus = 'IN_QC';
          await this.prisma.license_plate_numbers.updateMany({
            where: { tenant_id: tenantId, lpn_id: lpn.lpn_id },
            data: { updated_at: new Date() },
          });
        } else {
          // APP-QC-D: Separate REJECTED vs QUARANTINED
          newLpnStatus = 'QUARANTINED';
        }
        await this.prisma.license_plate_numbers.updateMany({
          where: { tenant_id: tenantId, lpn_id: lpn.lpn_id },
          data: { status: newLpnStatus as any, updated_at: new Date() },
        });

        if (overallResult !== 'PASS') {
          const holdNumber = `HOLD-${Date.now()}`;
          await this.prisma.quality_holds.create({
            data: {
              tenant_id: tenantId,
              facility_id: inspection.facility_id,
              hold_number: holdNumber,
              hold_name: `QC Fail: ${inspection.inspection_number}`,
              reference_type: 'LPN',
              reference_id: lpn.lpn_id,
              product_id: lpn.product_id,
              hold_reason: dto.failureReason || 'QC_INSPECTION_FAIL',
              hold_reason_code: dto.failureReason || 'QC_FAIL',
              placed_by_user_id: dto.inspectorUserId || '',
              affected_quantity: 1,
              notes: `Auto-hold from QC inspection ${inspection.inspection_number}`,
              status: 'OPEN',
            },
          });
        }
      }
    }
    return { ...result, requiresSupervisorReview, overallResult };
  }

  // GAP-4: Lot validation
  async validateLot(tenantId: string, inspectionId: bigint, actualLotNumber: string) {
    const inspection = await this.prisma.quality_inspections.findUnique({
      where: { inspection_id: inspectionId },
    });
    if (!inspection) throw new NotFoundException('Inspection not found');
    let expectedLot: string | null = null;
    if (inspection.reference_type === 'LPN') {
      const lpn = await this.prisma.license_plate_numbers.findFirst({
        where: { tenant_id: tenantId, lpn_id: inspection.reference_id },
      });
      if (lpn?.grn_line_id) {
        const grnItem = await this.prisma.goods_receipt_items.findFirst({
          where: { tenant_id: tenantId, receipt_item_id: lpn.grn_line_id },
        });
        if (grnItem) {
          const line = await this.prisma.goods_receipt_lines.findFirst({
            where: { tenant_id: tenantId, receipt_line_id: grnItem.receipt_line_id },
          });
          if (line?.lot_number) expectedLot = line.lot_number;
        }
      }
    }
    const match = !expectedLot || expectedLot === actualLotNumber;
    await this.prisma.quality_inspection_events.create({
      data: {
        tenant_id: tenantId,
        inspection_id: inspectionId,
        event_type: 'LOT_VALIDATED',
        inspector_user_id: BigInt(0),
        new_result: match ? 'PASS' : 'FAIL',
        reason: match ? 'Lot matched' : `Lot mismatch: expected ${expectedLot}, got ${actualLotNumber}`,
      },
    });
    return { match, expectedLot, actualLotNumber };
  }

  // GAP-4: Expiry validation
  async validateExpiry(tenantId: string, productId: bigint, expiryDate: Date, facilityId: bigint) {
    if (!expiryDate) return { valid: false, reason: 'EXPIRY_MISSING', message: 'Expiry date not provided' };
    const mapping = await this.prisma.product_inspection_profiles.findFirst({
      where: { tenant_id: tenantId, product_id: productId, is_active: true },
    });
    const minExpiryDays = mapping?.min_expiry_days || 0;
    const daysRemaining = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysRemaining < minExpiryDays) {
      return { valid: false, reason: 'EXPIRY_BELOW_THRESHOLD', daysRemaining, minExpiryDays };
    }
    return { valid: true, reason: 'EXPIRY_VALID', daysRemaining, minExpiryDays };
  }

  // GAP-5: Directed work
  async getNextQcTask(tenantId: string, facilityId: bigint, userId: string) {
    const inspection = await this.prisma.quality_inspections.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, status: 'PENDING', assigned_to_user_id: null },
      orderBy: { created_at: 'asc' },
    });
    if (!inspection) return null;
    await this.prisma.quality_inspections.update({
      where: { inspection_id: inspection.inspection_id },
      data: { status: 'ASSIGNED', assigned_to_user_id: userId },
    });
    const lpn = inspection.reference_type === 'LPN'
      ? await this.prisma.license_plate_numbers.findFirst({
          where: { tenant_id: tenantId, lpn_id: inspection.reference_id },
        })
      : null;
    let checklist: any = null;
    if (inspection.product_id) {
      const mapping = await this.prisma.product_inspection_profiles.findFirst({
        where: { tenant_id: tenantId, product_id: inspection.product_id, is_active: true },
      });
      if (mapping) {
        const items = await this.prisma.inspection_checklist_items.findMany({
          where: { profile_id: mapping.profile_id },
          orderBy: { sort_order: 'asc' },
        });
        checklist = items;
      }
    }
    return { ...inspection, lpn, checklist };
  }

  // GAP-7: Supervisor review
  async getPendingReviews(tenantId: string, facilityId: bigint) {
    return this.prisma.quality_inspections.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, status: 'AWAITING_SUPERVISOR_REVIEW' },
      orderBy: { completed_at: 'asc' },
    });
  }

  async supervisorApprove(tenantId: string, inspectionId: bigint, supervisorId: string, overrideDisposition?: string) {
    const inspection = await this.prisma.quality_inspections.findUnique({
      where: { inspection_id: inspectionId },
    });
    if (!inspection) throw new NotFoundException('Inspection not found');
    if (inspection.status !== 'AWAITING_SUPERVISOR_REVIEW') {
      throw new BadRequestException(`Inspection status is ${inspection.status}, not awaiting review`);
    }
    await this.prisma.quality_inspections.update({
      where: { inspection_id: inspectionId },
      data: { status: 'COMPLETED', completed_at: new Date(), result: overrideDisposition || inspection.result },
    });
    await this.prisma.quality_inspection_events.create({
      data: {
        tenant_id: tenantId,
        inspection_id: inspectionId,
        event_type: 'SUPERVISOR_APPROVED',
        previous_result: inspection.result,
        new_result: overrideDisposition || inspection.result || 'PASS',
        inspector_user_id: BigInt(0),
      },
    });
    return { approved: true, inspectionId };
  }

  async supervisorReject(tenantId: string, inspectionId: bigint, supervisorId: string) {
    const inspection = await this.prisma.quality_inspections.findUnique({
      where: { inspection_id: inspectionId },
    });
    if (!inspection) throw new NotFoundException('Inspection not found');
    const newInspection = await this.prisma.quality_inspections.create({
      data: {
        tenant_id: tenantId,
        facility_id: inspection.facility_id,
        inspection_number: `REINSPECT-${inspection.inspection_number}-${Date.now()}`,
        reference_type: inspection.reference_type,
        reference_id: inspection.reference_id || BigInt(0),
        product_id: inspection.product_id,
        lot_id: inspection.lot_id,
        inspection_type: inspection.inspection_type || '',
        inspection_scope: inspection.inspection_scope || '',
        status: 'PENDING',
        notes: `Reinspection of ${inspection.inspection_number} requested by ${supervisorId}`,
      },
    });
    // Reset LPN to QC_HOLD
    if (inspection.reference_type === 'LPN') {
      await this.prisma.license_plate_numbers.updateMany({
        where: { tenant_id: tenantId, lpn_id: inspection.reference_id },
        data: { status: 'IN_QC', updated_at: new Date() },
      });
    }
    await this.prisma.quality_inspection_events.create({
      data: {
        tenant_id: tenantId,
        inspection_id: inspectionId,
        event_type: 'SUPERVISOR_REJECTED',
        previous_result: inspection.result,
        new_result: 'PENDING',
        inspector_user_id: BigInt(0),
      },
    });
    return { rejected: true, originalInspectionId: inspectionId, newInspectionId: newInspection.inspection_id };
  }

  async delete(tenantId: string, id: string) {
    await this.prisma.quality_inspections.deleteMany({
      where: { tenant_id: tenantId, inspection_id: BigInt(id) },
    });
    return { message: 'Inspection deleted successfully' };
  }

  async getTimeline(tenantId: string, id: string) {
    const inspection = await this.prisma.quality_inspections.findUnique({
      where: { inspection_id: BigInt(id) },
    });
    if (!inspection) throw new NotFoundException('Inspection not found');
    const events = await this.prisma.quality_inspection_events.findMany({
      where: { tenant_id: tenantId, inspection_id: BigInt(id) },
      orderBy: { event_timestamp: 'asc' },
    });
    return { inspection, events };
  }
}
