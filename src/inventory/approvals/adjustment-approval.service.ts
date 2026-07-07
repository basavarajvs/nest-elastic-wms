import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdjustmentApprovalService {
  constructor(private readonly prisma: PrismaService) {}

  async findPending(tenantId: string, query: any) {
    const { facilityId } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId, status: 'PENDING' as any };
    if (facilityId) where.facility_id = BigInt(facilityId);
    const [data, total] = await Promise.all([
      this.prisma.adjustment_approval_requests.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'asc' },
      }),
      this.prisma.adjustment_approval_requests.count({ where }),
    ]);
    const facilityIds = [...new Set(data.map(r => r.facility_id))];
    const facilities = facilityIds.length
      ? await this.prisma.warehouse_facilities.findMany({ where: { tenant_id: tenantId, facility_id: { in: facilityIds } }, select: { facility_id: true, facility_name: true } })
      : [];
    const facilityMap = new Map(facilities.map(f => [f.facility_id.toString(), f.facility_name]));
    const mappedData = data.map(r => ({ ...r, facility_name: facilityMap.get(r.facility_id.toString()) ?? null }));
    return { data: mappedData, total, page, limit };
  }

  async delete(tenantId: string, id: bigint) {
    const entity = await this.prisma.adjustment_approval_requests.findFirst({
      where: { tenant_id: tenantId, request_id: id },
    });
    await this.prisma.adjustment_approval_requests.deleteMany({
      where: { tenant_id: tenantId, request_id: id },
    });
    return entity;
  }

  async approve(tenantId: string, id: string, userId: string) {
    return this.prisma.adjustment_approval_requests.update({
      where: { request_id: BigInt(id) },
      data: { status: 'APPROVED' as any, reviewed_by: BigInt(userId), reviewed_at: new Date() },
    });
  }

  async reject(tenantId: string, id: string, userId: string, reason?: string) {
    return this.prisma.adjustment_approval_requests.update({
      where: { request_id: BigInt(id) },
      data: { status: 'REJECTED' as any, reviewed_by: BigInt(userId), reviewed_at: new Date(), rejection_reason: reason },
    });
  }
}
