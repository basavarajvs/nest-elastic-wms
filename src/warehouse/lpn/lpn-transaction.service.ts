import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LpnTransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: {
    tenantId: string;
    facilityId: string;
    lpnId: string;
    transactionType: string;
    fromLocationId?: string | null;
    toLocationId?: string | null;
    quantityBefore?: number | null;
    quantityAfter?: number | null;
    quantityChange?: number | null;
    referenceType?: string | null;
    referenceId?: string | null;
    performedByUserId?: string | null;
    metadata?: any;
  }) {
    if (!data.tenantId || !data.facilityId || !data.lpnId || !data.transactionType) {
      throw new Error('Missing required fields for LpnTransaction: tenantId, facilityId, lpnId, transactionType');
    }
    return (this.prisma as any).lpnTransaction.create({ data });
  }

  async findByLpn(lpnId: string, tenantId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      (this.prisma as any).lpnTransaction.findMany({
        where: { lpnId, tenantId },
        orderBy: { transactionAt: 'desc' },
        skip,
        take: limit,
      }),
      (this.prisma as any).lpnTransaction.count({ where: { lpnId, tenantId } }),
    ]);
    return { data, total, page, limit };
  }

  async findAll(tenantId: string, filters?: { lpnId?: string; transactionType?: string; facilityId?: string }, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (filters?.lpnId) where.lpnId = filters.lpnId;
    if (filters?.transactionType) where.transactionType = filters.transactionType;
    if (filters?.facilityId) where.facilityId = filters.facilityId;
    const [data, total] = await Promise.all([
      (this.prisma as any).lpnTransaction.findMany({
        where,
        orderBy: { transactionAt: 'desc' },
        skip,
        take: limit,
      }),
      (this.prisma as any).lpnTransaction.count({ where }),
    ]);
    return { data, total, page, limit };
  }
}
