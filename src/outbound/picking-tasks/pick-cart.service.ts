import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PickCartService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.pick_carts.create({
      data: { tenant_id: tenantId, ...dto },
    });
  }

  async findAll(tenantId: string, query: any) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenant_id: tenantId };
    if (query.is_active !== undefined) where.is_active = query.is_active === 'true';
    if (query.cart_type) where.cart_type = query.cart_type;
    if (query.facility_id) where.facility_id = BigInt(query.facility_id);

    const [data, total] = await Promise.all([
      this.prisma.pick_carts.findMany({
        where,
        skip,
        take: limit,
        orderBy: { cart_id: 'desc' },
      }),
      this.prisma.pick_carts.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: bigint) {
    return this.prisma.pick_carts.findFirst({
      where: { tenant_id: tenantId, cart_id: id },
    });
  }

  async update(tenantId: string, id: bigint, dto: any) {
    return this.prisma.pick_carts.updateMany({
      where: { tenant_id: tenantId, cart_id: id },
      data: dto,
    });
  }

  async delete(tenantId: string, id: bigint) {
    const record = await this.findById(tenantId, id);
    await this.prisma.pick_carts.deleteMany({
      where: { tenant_id: tenantId, cart_id: id },
    });
    return record;
  }
}
