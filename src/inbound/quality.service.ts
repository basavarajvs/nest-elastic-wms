import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QualityService {
  constructor(private readonly prisma: PrismaService) {}

  async listInspections(tenantId: string, filters: {
    grnLineId?: string;
    result?: string;
    facilityId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    const where: any = { tenantId };
    if (filters.grnLineId) where.grnLineId = filters.grnLineId;
    if (filters.result) where.result = filters.result;
    if (filters.facilityId) where.facilityId = filters.facilityId;

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 200);
    const [data, total] = await Promise.all([
      (this.prisma as any).inspection.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          grnLine: { include: { receipt: true } },
          lPN: true,
        },
        orderBy: { inspectedAt: 'desc' },
      }),
      (this.prisma as any).inspection.count({ where }),
    ]);
    return { data, total };
  }

  async getInspection(id: string, tenantId: string): Promise<any> {
    const inspection = await (this.prisma as any).inspection.findFirst({
      where: { id, tenantId },
      include: {
        grnLine: { include: { receipt: true } },
        lPN: true,
      },
    });
    if (!inspection) throw new NotFoundException('Inspection not found');
    return inspection;
  }
}
