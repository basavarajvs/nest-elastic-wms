import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InspectionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * RF: Look up an LPN by barcode for QC inspection.
   * Returns LPN details, product info, receipt/ASN source, and existing QC history.
   */
  async lookupLpnForQc(tenantId: string, facilityId: bigint, barcode: string) {
    const lpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, lpn_number: barcode },
    });
    if (!lpn) throw new BadRequestException('LPN not found');

    const product = lpn.product_id
      ? await this.prisma.products.findFirst({ where: { tenant_id: tenantId, product_id: lpn.product_id } })
      : null;

    // Fetch receipt source if LPN has a GRN line reference
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

    // Fetch any existing inspections linked to this LPN or its product
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
    return this.prisma.quality_inspections.create({
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
      this.prisma.quality_inspections.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
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
    return { ...inspection, results };
  }

  async recordResult(tenantId: string, id: string, dto: any) {
    const inspection = await this.prisma.quality_inspections.findUnique({
      where: { inspection_id: BigInt(id) },
    });
    if (!inspection) throw new NotFoundException('Inspection not found');

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

    const totalResults = await this.prisma.quality_inspection_results.count({
      where: { tenant_id: tenantId, inspection_id: BigInt(id) },
    });
    const passedResults = await this.prisma.quality_inspection_results.count({
      where: { tenant_id: tenantId, inspection_id: BigInt(id), result_status: 'PASS' },
    });
    const failedResults = await this.prisma.quality_inspection_results.count({
      where: { tenant_id: tenantId, inspection_id: BigInt(id), result_status: { in: ['FAIL', 'CONDITIONAL'] } },
    });

    let overallResult: string;
    if (failedResults > 0) {
      const hasFail = await this.prisma.quality_inspection_results.findFirst({
        where: { tenant_id: tenantId, inspection_id: BigInt(id), result_status: 'FAIL' },
      });
      overallResult = hasFail ? 'FAIL' : 'CONDITIONAL';
    } else {
      overallResult = 'PASS';
    }

    await this.prisma.quality_inspections.update({
      where: { inspection_id: BigInt(id) },
      data: {
        result: overallResult,
        total_items_inspected: totalResults,
        total_passed_items: passedResults,
        total_failed_items: failedResults,
        completed_at: new Date(),
        status: 'COMPLETED',
      },
    });

    await this.prisma.quality_inspection_events.create({
      data: {
        tenant_id: tenantId,
        inspection_id: BigInt(id),
        event_type: 'RESULT_RECORDED',
        previous_result: inspection.result,
        new_result: overallResult,
        inspector_user_id: BigInt(dto.inspectorUserId || 0),
        inspector_name: dto.inspectorName,
        reason: dto.reason,
        metadata: dto.metadata || undefined,
      },
    });

    // Manhattan: update LPN status based on disposition
    if (inspection.reference_type === 'LPN') {
      const lpn = await this.prisma.license_plate_numbers.findFirst({
        where: { tenant_id: tenantId, lpn_id: inspection.reference_id },
      });
      if (lpn) {
        const newStatus = overallResult === 'PASS' ? 'IN_STAGING' : 'QUARANTINED';
        await this.prisma.license_plate_numbers.updateMany({
          where: { tenant_id: tenantId, lpn_id: lpn.lpn_id },
          data: { status: newStatus, updated_at: new Date() },
        });

        // Create quality hold on fail
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

    return result;
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
