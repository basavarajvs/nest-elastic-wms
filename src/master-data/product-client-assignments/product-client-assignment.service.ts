import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductClientAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  private async enrichRows(rows: any[]): Promise<any[]> {
    if (!rows.length) return rows;
    const tenantId = rows[0].tenant_id;
    const facilityIds = [...new Set(rows.map(r => r.facility_id))];
    const productIds = [...new Set(rows.map(r => r.product_id))];
    const clientIds = [...new Set(rows.map(r => r.client_id))];
    const [facilities, products, clients] = await Promise.all([
      facilityIds.length ? this.prisma.warehouse_facilities.findMany({ where: { tenant_id: tenantId, facility_id: { in: facilityIds } } }) : Promise.resolve([]),
      productIds.length ? this.prisma.products.findMany({ where: { tenant_id: tenantId, product_id: { in: productIds } } }) : Promise.resolve([]),
      clientIds.length ? this.prisma.clients.findMany({ where: { tenant_id: tenantId, client_id: { in: clientIds } } }) : Promise.resolve([]),
    ]) as [any[], any[], any[]];
    const facMap = new Map<bigint, string>();
    facilities.forEach(f => facMap.set(f.facility_id, f.facility_name));
    const prodMap = new Map<bigint, string>();
    products.forEach(p => prodMap.set(p.product_id, p.product_name));
    const clientMap = new Map<bigint, string>();
    clients.forEach(c => clientMap.set(c.client_id, c.client_name));
    return rows.map(r => ({
      ...r,
      facility_name: facMap.get(r.facility_id),
      product_name: prodMap.get(r.product_id),
      client_name: clientMap.get(r.client_id),
    }));
  }

  private async enrichRow(row: any): Promise<any> {
    if (!row) return row;
    const [rows] = await this.enrichRows([row]);
    return rows;
  }

  async create(tenantId: string, dto: any) {
    const row = await this.prisma.product_client_assignments.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        product_id: BigInt(dto.product_id),
        client_id: BigInt(dto.client_id),
        is_active: dto.is_active ?? true,
        effective_date: dto.effective_date ? new Date(dto.effective_date) : undefined,
        expiry_date: dto.expiry_date ? new Date(dto.expiry_date) : undefined,
        notes: dto.notes,
      },
    });
    return this.enrichRow(row);
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.isActive !== undefined) where.is_active = query.isActive;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.product_client_assignments.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.product_client_assignments.count({ where }),
    ]);
    return { data: await this.enrichRows(data), total, page, limit };
  }

  async findById(tenantId: string, assignmentId: bigint) {
    const row = await this.prisma.product_client_assignments.findFirst({
      where: { tenant_id: tenantId, assignment_id: assignmentId },
    });
    return this.enrichRow(row);
  }

  async findByProduct(tenantId: string, productId: bigint) {
    const rows = await this.prisma.product_client_assignments.findMany({
      where: { tenant_id: tenantId, product_id: productId, is_active: true },
    });
    return this.enrichRows(rows);
  }

  async findByClient(tenantId: string, clientId: bigint) {
    const rows = await this.prisma.product_client_assignments.findMany({
      where: { tenant_id: tenantId, client_id: clientId, is_active: true },
    });
    return this.enrichRows(rows);
  }

  async delete(tenantId: string, assignmentId: bigint) {
    const record = await this.findById(tenantId, assignmentId);
    await this.prisma.product_client_assignments.deleteMany({
      where: { tenant_id: tenantId, assignment_id: assignmentId },
    });
    return record;
  }
}
