import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdjustmentApprovalService {
  constructor(private readonly prisma: PrismaService) {}

  async findPending(tenantId: string, query: any) {
    const { facilityId, page = 1, limit = 50 } = query;
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
    return { data, total, page, limit };
  }

  async delete(tenantId: string, id: bigint) {
    return this.prisma.adjustment_approval_requests.deleteMany({
      where: { tenant_id: tenantId, request_id: id },
    });
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
