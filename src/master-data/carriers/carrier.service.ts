import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CarrierService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.carriers.create({
      data: {
        tenant_id: tenantId,
        carrier_code: dto.carrierCode,
        carrier_name: dto.carrierName,
        is_active: dto.isActive ?? true,
      },
    });
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
    const page = query.page || 1;
    const limit = query.limit || 20;
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
    return this.prisma.carriers.deleteMany({
      where: { tenant_id: tenantId, carrier_id: carrierId },
    });
  }

  async update(tenantId: string, carrierId: bigint, dto: any) {
    return this.prisma.carriers.updateMany({
      where: { tenant_id: tenantId, carrier_id: carrierId },
      data: { carrier_code: dto.carrierCode, carrier_name: dto.carrierName, is_active: dto.isActive },
    });
  }
}
