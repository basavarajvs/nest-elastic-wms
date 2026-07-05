import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ZoneService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.warehouse_zones.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        zone_code: dto.zoneCode,
        zone_name: dto.zoneName,
        zone_type: dto.zoneType || 'STORAGE',
        is_active: dto.isActive ?? true,
      },
    });
  }

  async findAll(tenantId: string, facilityId: bigint, query: any) {
    const where: any = { tenant_id: tenantId, facility_id: facilityId };
    if (query.isActive !== undefined) where.is_active = query.isActive;
    if (query.zoneType) where.zone_type = query.zoneType;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.warehouse_zones.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { zone_code: 'asc' },
      }),
      this.prisma.warehouse_zones.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, zoneId: bigint) {
    return this.prisma.warehouse_zones.findFirst({
      where: { tenant_id: tenantId, zone_id: zoneId },
      include: { warehouse_facilities: { select: { facility_code: true, facility_name: true } } },
    });
  }

  async update(tenantId: string, zoneId: bigint, dto: any) {
    return this.prisma.warehouse_zones.updateMany({
      where: { tenant_id: tenantId, zone_id: zoneId },
      data: {
        zone_code: dto.zoneCode,
        zone_name: dto.zoneName,
        zone_type: dto.zoneType,
        is_active: dto.isActive,
      },
    });
  }

  async delete(tenantId: string, zoneId: bigint) {
    return this.prisma.warehouse_zones.updateMany({
      where: { tenant_id: tenantId, zone_id: zoneId },
      data: { is_active: false },
    });
  }
}
