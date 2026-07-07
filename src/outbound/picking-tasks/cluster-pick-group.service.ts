import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClusterPickGroupService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.cluster_pick_groups.create({
      data: { tenant_id: tenantId, ...dto },
    });
  }

  async findAll(tenantId: string, query: any) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenant_id: tenantId };
    if (query.status) where.status = query.status;
    if (query.cart_id) where.cart_id = BigInt(query.cart_id);
    if (query.wave_id) where.wave_id = BigInt(query.wave_id);
    if (query.picker_id) where.picker_id = query.picker_id;

    const [data, total] = await Promise.all([
      this.prisma.cluster_pick_groups.findMany({
        where,
        skip,
        take: limit,
        orderBy: { group_id: 'desc' },
      }),
      this.prisma.cluster_pick_groups.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: bigint) {
    return this.prisma.cluster_pick_groups.findFirst({
      where: { tenant_id: tenantId, group_id: id },
    });
  }

  async update(tenantId: string, id: bigint, dto: any) {
    return this.prisma.cluster_pick_groups.updateMany({
      where: { tenant_id: tenantId, group_id: id },
      data: dto,
    });
  }

  async delete(tenantId: string, id: bigint) {
    const record = await this.findById(tenantId, id);
    await this.prisma.cluster_pick_groups.deleteMany({
      where: { tenant_id: tenantId, group_id: id },
    });
    return record;
  }
}
