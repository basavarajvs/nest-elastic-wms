import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.storage_locations.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        zone_id: dto.zoneId ? BigInt(dto.zoneId) : undefined,
        aisle_id: dto.aisleId ? BigInt(dto.aisleId) : undefined,
        bay_id: dto.bayId ? BigInt(dto.bayId) : undefined,
        rack_row_id: dto.rackRowId ? BigInt(dto.rackRowId) : undefined,
        level_id: dto.levelId ? BigInt(dto.levelId) : undefined,
        location_code: dto.locationCode,
        location_name: dto.locationName || dto.locationCode,
        location_type: dto.locationType || 'EACH',
        is_active: dto.isActive ?? true,
      },
    });
  }

  async findAll(tenantId: string, facilityId: bigint, query: any) {
    const where: any = { tenant_id: tenantId, facility_id: facilityId };
    if (query.zoneId) where.zone_id = BigInt(query.zoneId);
    if (query.locationType) where.location_type = query.locationType;
    if (query.isActive !== undefined) where.is_active = query.isActive;
    if (query.search) {
      where.OR = [
        { location_code: { contains: query.search, mode: 'insensitive' } },
        { location_name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.storage_locations.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { location_code: 'asc' },
      }),
      this.prisma.storage_locations.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findByBarcode(tenantId: string, barcode: string) {
    const location = await this.prisma.storage_locations.findFirst({
      where: { tenant_id: tenantId, barcode_value: barcode, is_active: true },
    });
    if (!location) {
      const label = await this.prisma.barcode_labels.findFirst({
        where: { tenant_id: tenantId, barcode_value: barcode, entity_type: 'STORAGE_LOCATION', is_active: true },
      });
      if (!label || !label.entity_id) return null;
      return this.prisma.storage_locations.findFirst({
        where: { tenant_id: tenantId, location_id: BigInt(label.entity_id) },
      });
    }
    return location;
  }

  async findById(tenantId: string, locationId: bigint) {
    return this.prisma.storage_locations.findFirst({
      where: { tenant_id: tenantId, location_id: locationId },
    });
  }

  async update(tenantId: string, locationId: bigint, dto: any) {
    const data: any = {};
    if (dto.locationCode !== undefined) data.location_code = dto.locationCode;
    if (dto.locationName !== undefined) data.location_name = dto.locationName;
    if (dto.locationType !== undefined) data.location_type = dto.locationType;
    if (dto.isActive !== undefined) data.is_active = dto.isActive;
    if (dto.isBlocked !== undefined) data.is_blocked = dto.isBlocked;
    if (dto.isReserved !== undefined) data.is_reserved = dto.isReserved;
    return this.prisma.storage_locations.updateMany({
      where: { tenant_id: tenantId, location_id: locationId },
      data,
    });
  }

  async getCapacity(tenantId: string, locationId: bigint) {
    const location = await this.prisma.storage_locations.findFirst({
      where: { tenant_id: tenantId, location_id: locationId },
    });
    if (!location) return null;

    const onHand = await this.prisma.inventory_on_hand.aggregate({
      where: { tenant_id: tenantId, location_id: locationId },
      _sum: { quantity_on_hand: true },
    });

    return {
      locationCode: location.location_code,
      locationType: location.location_type,
      maxWeight: location.max_weight,
      maxVolume: location.max_volume,
      currentQty: onHand._sum?.quantity_on_hand || 0,
    };
  }

  async delete(tenantId: string, locationId: bigint) {
    return this.prisma.storage_locations.updateMany({
      where: { tenant_id: tenantId, location_id: locationId },
      data: { is_active: false },
    });
  }

  async findAvailable(tenantId: string, facilityId: bigint, locationType?: string) {
    const where: any = {
      tenant_id: tenantId,
      facility_id: facilityId,
      is_active: true,
      is_blocked: false,
      is_reserved: false,
    };
    if (locationType) where.location_type = locationType;
    return this.prisma.storage_locations.findMany({
      where,
      orderBy: { location_code: 'asc' },
      take: 100,
    });
  }

  async rfLookup(tenantId: string, barcode: string) {
    const location = await this.findByBarcode(tenantId, barcode);
    if (!location) return null;
    return {
      locationId: location.location_id.toString(),
      locationCode: location.location_code,
      locationName: location.location_name,
      locationType: location.location_type,
    };
  }
}
