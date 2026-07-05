import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductClientAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.product_client_assignments.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        product_id: BigInt(dto.productId),
        client_id: BigInt(dto.clientId),
        is_active: dto.isActive ?? true,
        effective_date: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
        expiry_date: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        notes: dto.notes,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.isActive !== undefined) where.is_active = query.isActive;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.product_client_assignments.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.product_client_assignments.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, assignmentId: bigint) {
    return this.prisma.product_client_assignments.findFirst({
      where: { tenant_id: tenantId, assignment_id: assignmentId },
    });
  }

  async findByProduct(tenantId: string, productId: bigint) {
    return this.prisma.product_client_assignments.findMany({
      where: { tenant_id: tenantId, product_id: productId, is_active: true },
    });
  }

  async findByClient(tenantId: string, clientId: bigint) {
    return this.prisma.product_client_assignments.findMany({
      where: { tenant_id: tenantId, client_id: clientId, is_active: true },
    });
  }

  async delete(tenantId: string, assignmentId: bigint) {
    return this.prisma.product_client_assignments.deleteMany({
      where: { tenant_id: tenantId, assignment_id: assignmentId },
    });
  }
}
