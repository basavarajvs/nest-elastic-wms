import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReceivingInspectionService {
  constructor(private readonly prisma: PrismaService) {}

  async createInspection(tenantId: string, dto: any) {
    const result = await this.prisma.$executeRawUnsafe(
      `INSERT INTO inspections (tenant_id, facility_id, receipt_id, product_id, lot_number, inspection_type, status, inspector_id, notes, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING *`,
      tenantId,
      dto.facilityId,
      dto.receiptId,
      dto.productId,
      dto.lotNumber || null,
      dto.inspectionType || 'RECEIVING',
      dto.status || 'PENDING',
      dto.inspectorId || null,
      dto.notes || null,
      dto.createdBy || null,
    );
    return result;
  }

  async findAllInspections(tenantId: string, query: any) {
    const { facilityId, status, receiptId, productId, page = 1, limit = 50 } = query;
    const offset = (page - 1) * limit;
    const conditions: string[] = [`i.tenant_id = $1`];
    const params: any[] = [tenantId];
    let paramIdx = 2;
    if (facilityId) { conditions.push(`i.facility_id = $${paramIdx++}`); params.push(facilityId); }
    if (status) { conditions.push(`i.status = $${paramIdx++}`); params.push(status); }
    if (receiptId) { conditions.push(`i.receipt_id = $${paramIdx++}`); params.push(receiptId); }
    if (productId) { conditions.push(`i.product_id = $${paramIdx++}`); params.push(productId); }
    const where = conditions.join(' AND ');
    const data = await this.prisma.$queryRawUnsafe(
      `SELECT i.* FROM inspections i WHERE ${where} ORDER BY i.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      ...params, limit, offset,
    );
    const countResult: any = await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as total FROM inspections i WHERE ${where}`,
      ...params.slice(0, params.length - 2),
    );
    const total = Number(countResult[0]?.total || 0);
    return { data, total, page, limit };
  }

  async findInspectionById(tenantId: string, id: string) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM inspections WHERE tenant_id = $1 AND id = $2`,
      tenantId, id,
    );
    if (!rows.length) throw new NotFoundException('Inspection not found');
    return rows[0];
  }

  async deleteInspection(tenantId: string, id: string) {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM inspections WHERE tenant_id = $1 AND id = $2`,
      tenantId, id,
    );
    return { message: 'Inspection deleted successfully' };
  }

  async deleteQcDisposition(tenantId: string, id: string) {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM qc_dispositions WHERE tenant_id = $1 AND id = $2`,
      tenantId, id,
    );
    return { message: 'QC disposition deleted successfully' };
  }

  async createQcDisposition(tenantId: string, dto: any) {
    const result = await this.prisma.$executeRawUnsafe(
      `INSERT INTO qc_dispositions (tenant_id, facility_id, receipt_line_id, product_id, disposition_type, disposition_qty, reason_code, inspector_id, notes, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
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
    const conditions: string[] = [`d.tenant_id = $1`];
    const params: any[] = [tenantId];
    let paramIdx = 2;
    if (facilityId) { conditions.push(`d.facility_id = $${paramIdx++}`); params.push(facilityId); }
    if (receiptLineId) { conditions.push(`d.receipt_line_id = $${paramIdx++}`); params.push(receiptLineId); }
    if (dispositionType) { conditions.push(`d.disposition_type = $${paramIdx++}`); params.push(dispositionType); }
    const where = conditions.join(' AND ');
    const data = await this.prisma.$queryRawUnsafe(
      `SELECT d.* FROM qc_dispositions d WHERE ${where} ORDER BY d.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      ...params, limit, offset,
    );
    const countResult: any = await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as total FROM qc_dispositions d WHERE ${where}`,
      ...params.slice(0, params.length - 2),
    );
    const total = Number(countResult[0]?.total || 0);
    return { data, total, page, limit };
  }
}
