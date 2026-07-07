import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PickCartAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.pick_cart_assignments.create({
      data: { tenant_id: tenantId, ...dto },
    });
  }

  async findAll(tenantId: string, query: any) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenant_id: tenantId };
    if (query.cart_id) where.cart_id = BigInt(query.cart_id);
    if (query.session_id) where.session_id = BigInt(query.session_id);
    if (query.shelf_position) where.shelf_position = query.shelf_position;

    const [data, total] = await Promise.all([
      this.prisma.pick_cart_assignments.findMany({
        where,
        skip,
        take: limit,
        orderBy: { assignment_id: 'desc' },
      }),
      this.prisma.pick_cart_assignments.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: bigint) {
    return this.prisma.pick_cart_assignments.findFirst({
      where: { tenant_id: tenantId, assignment_id: id },
    });
  }

  async update(tenantId: string, id: bigint, dto: any) {
    return this.prisma.pick_cart_assignments.updateMany({
      where: { tenant_id: tenantId, assignment_id: id },
      data: dto,
    });
  }

  async delete(tenantId: string, id: bigint) {
    const record = await this.findById(tenantId, id);
    await this.prisma.pick_cart_assignments.deleteMany({
      where: { tenant_id: tenantId, assignment_id: id },
    });
    return record;
  }
}
