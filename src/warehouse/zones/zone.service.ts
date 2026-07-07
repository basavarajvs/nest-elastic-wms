import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ZoneService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const record = await this.prisma.warehouse_zones.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        zone_code: dto.zone_code,
        zone_name: dto.zone_name,
        zone_type: dto.zone_type || 'STORAGE',
        description: dto.description,
        configuration_json: dto.configuration_json,
        layout_coordinates_json: dto.layout_coordinates_json,
        visual_map_url: dto.visual_map_url,
        zone_color_hex: dto.zone_color_hex,
        is_active: dto.is_active ?? true,
      },
      include: { warehouse_facilities: { select: { facility_name: true } } },
    });
    return this.flattenZone(record);
  }

  async findAll(tenantId: string, facilityId: bigint, query: any) {
    const where: any = { tenant_id: tenantId, facility_id: facilityId };
    if (query.isActive !== undefined) where.is_active = query.isActive;
    if (query.zoneType) where.zone_type = query.zoneType;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.warehouse_zones.findMany({
        where,
        include: { warehouse_facilities: { select: { facility_name: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { zone_code: 'asc' },
      }),
      this.prisma.warehouse_zones.count({ where }),
    ]);
    return { data: data.map(r => this.flattenZone(r)), total, page, limit };
  }

  async findById(tenantId: string, zoneId: bigint) {
    const record = await this.prisma.warehouse_zones.findFirst({
      where: { tenant_id: tenantId, zone_id: zoneId },
      include: { warehouse_facilities: { select: { facility_name: true } } },
    });
    return record ? this.flattenZone(record) : null;
  }

  async update(tenantId: string, zoneId: bigint, dto: any) {
    const data: any = {};
    if (dto.zone_code !== undefined) data.zone_code = dto.zone_code;
    if (dto.zone_name !== undefined) data.zone_name = dto.zone_name;
    if (dto.zone_type !== undefined) data.zone_type = dto.zone_type;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.configuration_json !== undefined) data.configuration_json = dto.configuration_json;
    if (dto.layout_coordinates_json !== undefined) data.layout_coordinates_json = dto.layout_coordinates_json;
    if (dto.visual_map_url !== undefined) data.visual_map_url = dto.visual_map_url;
    if (dto.zone_color_hex !== undefined) data.zone_color_hex = dto.zone_color_hex;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    await this.prisma.warehouse_zones.updateMany({
      where: { tenant_id: tenantId, zone_id: zoneId },
      data,
    });
    return this.findById(tenantId, zoneId);
  }

  async delete(tenantId: string, zoneId: bigint) {
    await this.prisma.warehouse_zones.updateMany({
      where: { tenant_id: tenantId, zone_id: zoneId },
      data: { is_active: false },
    });
    return this.findById(tenantId, zoneId);
  }

  private flattenZone(record: any) {
    const { warehouse_facilities, ...rest } = record;
    return { ...rest, facility_name: warehouse_facilities?.facility_name || null };
  }
}
