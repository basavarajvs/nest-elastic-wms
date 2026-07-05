import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReceivingInspectionService {
  constructor(private readonly prisma: PrismaService) {}

  async createInspection(tenantId: string, dto: any) {
    const inspection = await this.prisma.quality_inspections.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        inspection_number: `RI-${Date.now()}`,
        inspection_name: dto.inspectionName || `Receiving Inspection ${dto.productId}`,
        description: dto.notes || null,
        reference_type: 'RECEIVING',
        reference_id: BigInt(dto.receiptId || 0),
        product_id: dto.productId ? BigInt(dto.productId) : undefined,
        inspection_type: dto.inspectionType || 'RECEIVING',
        inspection_scope: 'RECEIVING',
        status: dto.status || 'PENDING',
        notes: dto.notes || null,
        created_by: dto.createdBy || null,
      },
    });

    // Store lot_number in notes or as metadata since quality_inspections doesn't have lot_number
    if (dto.lotNumber) {
      await this.prisma.quality_inspections.updateMany({
        where: { tenant_id: tenantId, inspection_id: inspection.inspection_id },
        data: { notes: `Lot: ${dto.lotNumber} | ${dto.notes || ''}` },
      });
    }

    return this.findInspectionById(tenantId, inspection.inspection_id.toString());
  }

  async findAllInspections(tenantId: string, query: any) {
    const { facilityId, status, receiptId, productId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId };
    if (facilityId) where.facility_id = BigInt(facilityId);
    if (status) where.status = status;
    if (receiptId) where.reference_id = BigInt(receiptId);
    if (productId) where.product_id = BigInt(productId);

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

  async findInspectionById(tenantId: string, id: string) {
    const inspection = await this.prisma.quality_inspections.findFirst({
      where: { tenant_id: tenantId, inspection_id: BigInt(id) },
    });
    if (!inspection) throw new NotFoundException('Inspection not found');
    return inspection;
  }

  async deleteInspection(tenantId: string, id: string) {
    await this.prisma.quality_inspections.deleteMany({
      where: { tenant_id: tenantId, inspection_id: BigInt(id) },
    });
    return { message: 'Inspection deleted successfully' };
  }

  async deleteQcDisposition(tenantId: string, id: string) {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM multitenant.qc_dispositions WHERE tenant_id = $1::uuid AND id = $2::bigint`,
      tenantId, id,
    );
    return { message: 'QC disposition deleted successfully' };
  }

  async createQcDisposition(tenantId: string, dto: any) {
    const result = await this.prisma.$executeRawUnsafe(
      `INSERT INTO multitenant.qc_dispositions (tenant_id, facility_id, receipt_line_id, product_id, disposition_type, disposition_qty, reason_code, inspector_id, notes, created_by, created_at)
       VALUES ($1::uuid, $2::bigint, $3::bigint, $4::bigint, $5, $6, $7, $8::uuid, $9, $10::uuid, NOW())
       RETURNING *`,
      tenantId,
      dto.facilityId,
      dto.receiptLineId,
      dto.productId,
      dto.dispositionType,
      dto.dispositionQty || 0,
      dto.reasonCode || null,
      dto.inspectorId || null,
      dto.notes || null,
      dto.createdBy || null,
    );
    return result;
  }

  async findAllQcDispositions(tenantId: string, query: any) {
    const { facilityId, receiptLineId, dispositionType, page = 1, limit = 50 } = query;
    const offset = (page - 1) * limit;
    const conditions: string[] = [`d.tenant_id = $1::uuid`];
    const params: any[] = [tenantId];
    let paramIdx = 2;
    if (facilityId) { conditions.push(`d.facility_id = $${paramIdx++}`); params.push(facilityId); }
    if (receiptLineId) { conditions.push(`d.receipt_line_id = $${paramIdx++}`); params.push(receiptLineId); }
    if (dispositionType) { conditions.push(`d.disposition_type = $${paramIdx++}`); params.push(dispositionType); }
    const where = conditions.join(' AND ');
    const data = await this.prisma.$queryRawUnsafe(
      `SELECT d.* FROM multitenant.qc_dispositions d WHERE ${where} ORDER BY d.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      ...params, limit, offset,
    );
    const countResult: any = await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as total FROM multitenant.qc_dispositions d WHERE ${where}`,
      ...params.slice(0, params.length - 2),
    );
    const total = Number(countResult[0]?.total || 0);
    return { data, total, page, limit };
  }
}
