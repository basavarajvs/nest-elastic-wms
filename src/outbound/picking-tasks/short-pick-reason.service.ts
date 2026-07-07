import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ShortPickReasonService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.short_pick_reasons.create({
      data: { tenant_id: tenantId, ...dto },
    });
  }

  async findAll(tenantId: string, query: any) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenant_id: tenantId };
    if (query.is_active !== undefined) where.is_active = query.is_active === 'true';
    if (query.reason_code) where.reason_code = { contains: query.reason_code, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.short_pick_reasons.findMany({
        where,
        skip,
        take: limit,
        orderBy: { reason_id: 'desc' },
      }),
      this.prisma.short_pick_reasons.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: bigint) {
    return this.prisma.short_pick_reasons.findFirst({
      where: { tenant_id: tenantId, reason_id: id },
    });
  }

  async update(tenantId: string, id: bigint, dto: any) {
    return this.prisma.short_pick_reasons.updateMany({
      where: { tenant_id: tenantId, reason_id: id },
      data: dto,
    });
  }

  async delete(tenantId: string, id: bigint) {
    const record = await this.findById(tenantId, id);
    await this.prisma.short_pick_reasons.deleteMany({
      where: { tenant_id: tenantId, reason_id: id },
    });
    return record;
  }
}
