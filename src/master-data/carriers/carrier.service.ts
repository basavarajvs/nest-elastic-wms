import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CarrierService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const data: any = {
      tenant_id: tenantId,
      carrier_code: dto.carrier_code,
      carrier_name: dto.carrier_name,
    };
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.contact_name !== undefined) data.contact_name = dto.contact_name;
    if (dto.contact_email !== undefined) data.contact_email = dto.contact_email;
    if (dto.contact_phone !== undefined) data.contact_phone = dto.contact_phone;
    if (dto.api_endpoint_url !== undefined) data.api_endpoint_url = dto.api_endpoint_url;
    if (dto.api_key !== undefined) data.api_key = dto.api_key;
    if (dto.api_username !== undefined) data.api_username = dto.api_username;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    return this.prisma.carriers.create({ data });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.isActive !== undefined) where.is_active = query.isActive;
    if (query.search) {
      where.OR = [
        { carrier_code: { contains: query.search, mode: 'insensitive' } },
        { carrier_name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.carriers.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { carrier_code: 'asc' } }),
      this.prisma.carriers.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, carrierId: bigint) {
    return this.prisma.carriers.findFirst({ where: { tenant_id: tenantId, carrier_id: carrierId } });
  }

  async delete(tenantId: string, carrierId: bigint) {
    const record = await this.findById(tenantId, carrierId);
    await this.prisma.carriers.deleteMany({
      where: { tenant_id: tenantId, carrier_id: carrierId },
    });
    return record;
  }

  async update(tenantId: string, carrierId: bigint, dto: any) {
    const data: any = {};
    if (dto.carrier_code !== undefined) data.carrier_code = dto.carrier_code;
    if (dto.carrier_name !== undefined) data.carrier_name = dto.carrier_name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.contact_name !== undefined) data.contact_name = dto.contact_name;
    if (dto.contact_email !== undefined) data.contact_email = dto.contact_email;
    if (dto.contact_phone !== undefined) data.contact_phone = dto.contact_phone;
    if (dto.api_endpoint_url !== undefined) data.api_endpoint_url = dto.api_endpoint_url;
    if (dto.api_key !== undefined) data.api_key = dto.api_key;
    if (dto.api_username !== undefined) data.api_username = dto.api_username;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    await this.prisma.carriers.updateMany({
      where: { tenant_id: tenantId, carrier_id: carrierId },
      data,
    });
    return this.findById(tenantId, carrierId);
  }
}
