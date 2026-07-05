import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.customers.create({
      data: {
        tenant_id: tenantId,
        customer_code: dto.customerCode,
        customer_name: dto.customerName,
        is_active: dto.isActive ?? true,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.isActive !== undefined) where.is_active = query.isActive;
    if (query.search) {
      where.OR = [
        { customer_code: { contains: query.search, mode: 'insensitive' } },
        { customer_name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.customers.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { customer_code: 'asc' } }),
      this.prisma.customers.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, customerId: bigint) {
    return this.prisma.customers.findFirst({ where: { tenant_id: tenantId, customer_id: customerId } });
  }

  async delete(tenantId: string, customerId: bigint) {
    return this.prisma.customers.deleteMany({
      where: { tenant_id: tenantId, customer_id: customerId },
    });
  }

  async update(tenantId: string, customerId: bigint, dto: any) {
    return this.prisma.customers.updateMany({
      where: { tenant_id: tenantId, customer_id: customerId },
      data: { customer_code: dto.customerCode, customer_name: dto.customerName, is_active: dto.isActive },
    });
  }
}
