import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FacilityService {
  private readonly logger = new Logger(FacilityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.warehouse_facilities.create({
      data: {
        tenant_id: tenantId,
        facility_code: dto.facility_code,
        facility_name: dto.facility_name,
        facility_type: dto.facility_type ?? 'WAREHOUSE',
        description: dto.description,
        address_line1: dto.address_line1,
        address_line2: dto.address_line2,
        city: dto.city,
        state_province: dto.state_province,
        postal_code: dto.postal_code,
        country_code: dto.country_code,
        contact_person: dto.contact_person,
        contact_phone: dto.contact_phone,
        contact_email: dto.contact_email,
        timezone_name: dto.timezone_name,
        default_uom_id: dto.default_uom_id ? BigInt(dto.default_uom_id) : undefined,
        is_active: dto.is_active ?? true,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.isActive !== undefined) where.is_active = query.isActive;
    if (query.search) {
      where.OR = [
        { facility_code: { contains: query.search, mode: 'insensitive' } },
        { facility_name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.warehouse_facilities.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { facility_code: 'asc' },
      }),
      this.prisma.warehouse_facilities.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, facilityId: bigint) {
    return this.prisma.warehouse_facilities.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId },
    });
  }

  async update(tenantId: string, facilityId: bigint, dto: any) {
    const data: any = {};
    if (dto.facility_code !== undefined) data.facility_code = dto.facility_code;
    if (dto.facility_name !== undefined) data.facility_name = dto.facility_name;
    if (dto.facility_type !== undefined) data.facility_type = dto.facility_type;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.address_line1 !== undefined) data.address_line1 = dto.address_line1;
    if (dto.address_line2 !== undefined) data.address_line2 = dto.address_line2;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.state_province !== undefined) data.state_province = dto.state_province;
    if (dto.postal_code !== undefined) data.postal_code = dto.postal_code;
    if (dto.country_code !== undefined) data.country_code = dto.country_code;
    if (dto.contact_person !== undefined) data.contact_person = dto.contact_person;
    if (dto.contact_phone !== undefined) data.contact_phone = dto.contact_phone;
    if (dto.contact_email !== undefined) data.contact_email = dto.contact_email;
    if (dto.timezone_name !== undefined) data.timezone_name = dto.timezone_name;
    if (dto.default_uom_id !== undefined) data.default_uom_id = BigInt(dto.default_uom_id);
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    await this.prisma.warehouse_facilities.updateMany({
      where: { tenant_id: tenantId, facility_id: facilityId },
      data,
    });
    return this.findById(tenantId, facilityId);
  }

  async getHierarchy(tenantId: string, facilityId: bigint) {
    const facility = await this.prisma.warehouse_facilities.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId },
    });
    if (!facility) return null;

    const zones = await this.prisma.warehouse_zones.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, is_active: true },
      orderBy: { zone_code: 'asc' },
    });

    const aisles = await this.prisma.aisles.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, is_active: true },
      orderBy: { aisle_code: 'asc' },
    });

    const rackRows = await this.prisma.rack_rows.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, is_active: true },
      orderBy: { rack_row_code: 'asc' },
    });

    const bays = await this.prisma.bays.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, is_active: true },
      orderBy: { bay_code: 'asc' },
    });

    const levels = await this.prisma.rack_levels.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, is_active: true },
      orderBy: { level_number: 'asc' },
    });

    const locations = await this.prisma.storage_locations.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, is_active: true },
      orderBy: { location_code: 'asc' },
    });

    return {
      facility,
      zones: zones.map((zone) => ({
        ...zone,
        aisles: aisles
          .filter((a) => a.zone_id === zone.zone_id)
          .map((aisle) => ({
            ...aisle,
            rackRows: rackRows
              .filter((r) => r.aisle_id === aisle.aisle_id)
              .map((row) => ({
                ...row,
                bays: bays
                  .filter((b) => b.rack_row_id === row.rack_row_id)
                  .map((bay) => ({
                    ...bay,
                    levels: levels.filter((l) => l.bay_id === bay.bay_id),
                    locations: locations.filter(
                      (loc) => loc.bay_id === bay.bay_id || loc.rack_row_id === row.rack_row_id,
                    ),
                  })),
              })),
          })),
      })),
      unassignedLocations: locations.filter((l) => !l.zone_id),
      summary: {
        totalZones: zones.length,
        totalAisles: aisles.length,
        totalRackRows: rackRows.length,
        totalBays: bays.length,
        totalLevels: levels.length,
        totalLocations: locations.length,
      },
    };
  }

  async delete(tenantId: string, facilityId: bigint) {
    await this.prisma.warehouse_facilities.updateMany({
      where: { tenant_id: tenantId, facility_id: facilityId },
      data: { is_active: false },
    });
    return this.findById(tenantId, facilityId);
  }

  async getSummary(tenantId: string) {
    const facilities = await this.prisma.warehouse_facilities.findMany({
      where: { tenant_id: tenantId },
    });

    const summaries = await Promise.all(
      facilities.map(async (facility) => {
        const [zoneCount, locationCount] = await Promise.all([
          this.prisma.warehouse_zones.count({
            where: { tenant_id: tenantId, facility_id: facility.facility_id },
          }),
          this.prisma.storage_locations.count({
            where: { tenant_id: tenantId, facility_id: facility.facility_id },
          }),
        ]);
        return {
          facilityId: facility.facility_id.toString(),
          facilityCode: facility.facility_code,
          facilityName: facility.facility_name,
          zoneCount,
          locationCount,
        };
      }),
    );

    return {
      total: facilities.length,
      facilities: summaries,
    };
  }
}
