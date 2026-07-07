import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const data: any = {
      tenant_id: tenantId,
      customer_code: dto.customer_code,
      customer_name: dto.customer_name,
    };
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.address_line1 !== undefined) data.address_line1 = dto.address_line1;
    if (dto.address_line2 !== undefined) data.address_line2 = dto.address_line2;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.state_province !== undefined) data.state_province = dto.state_province;
    if (dto.postal_code !== undefined) data.postal_code = dto.postal_code;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    return this.prisma.customers.create({ data });
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
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
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
    const record = await this.findById(tenantId, customerId);
    await this.prisma.customers.deleteMany({
      where: { tenant_id: tenantId, customer_id: customerId },
    });
    return record;
  }

  async update(tenantId: string, customerId: bigint, dto: any) {
    const data: any = {};
    if (dto.customer_code !== undefined) data.customer_code = dto.customer_code;
    if (dto.customer_name !== undefined) data.customer_name = dto.customer_name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.address_line1 !== undefined) data.address_line1 = dto.address_line1;
    if (dto.address_line2 !== undefined) data.address_line2 = dto.address_line2;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.state_province !== undefined) data.state_province = dto.state_province;
    if (dto.postal_code !== undefined) data.postal_code = dto.postal_code;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    await this.prisma.customers.updateMany({
      where: { tenant_id: tenantId, customer_id: customerId },
      data,
    });
    return this.findById(tenantId, customerId);
  }
}
