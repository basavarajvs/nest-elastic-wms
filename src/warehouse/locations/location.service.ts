import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(private readonly prisma: PrismaService) {}

  private locationInclude = {
    warehouse_facilities: { select: { facility_name: true } as const },
  } as const;

  private flattenLocation(record: any) {
    if (!record) return null;
    const { warehouse_facilities, ...rest } = record;
    return { ...rest, facility_name: warehouse_facilities?.facility_name || null };
  }

  private flattenLocations(records: any[]) {
    return records.map(r => this.flattenLocation(r));
  }

  async create(tenantId: string, dto: any) {
    const record = await this.prisma.storage_locations.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        zone_id: dto.zone_id ? BigInt(dto.zone_id) : undefined,
        aisle_id: dto.aisle_id ? BigInt(dto.aisle_id) : undefined,
        bay_id: dto.bay_id ? BigInt(dto.bay_id) : undefined,
        rack_row_id: dto.rack_row_id ? BigInt(dto.rack_row_id) : undefined,
        level_id: dto.level_id ? BigInt(dto.level_id) : undefined,
        location_code: dto.location_code,
        location_name: dto.location_name || dto.location_code,
        location_type: dto.location_type || 'EACH',
        description: dto.description,
        length: dto.length,
        width: dto.width,
        height: dto.height,
        max_weight: dto.max_weight,
        max_volume: dto.max_volume,
        allowed_product_categories_json: dto.allowed_product_categories_json,
        allowed_product_attributes_json: dto.allowed_product_attributes_json,
        allowed_storage_conditions_json: dto.allowed_storage_conditions_json,
        is_active: dto.is_active ?? true,
        is_blocked: dto.is_blocked ?? false,
        is_reserved: dto.is_reserved ?? false,
        location_tier: dto.location_tier,
        block_reason: dto.block_reason,
        reservation_details_json: dto.reservation_details_json,
        pick_sequence_number: dto.pick_sequence_number,
        travel_distance_from_dock: dto.travel_distance_from_dock,
        barcode_value: dto.barcode_value,
        qr_code_data: dto.qr_code_data,
        label_printed_at: dto.label_printed_at ? new Date(dto.label_printed_at) : undefined,
        client_id: dto.client_id ? BigInt(dto.client_id) : undefined,
        bay_number: dto.bay_number,
      },
      include: this.locationInclude,
    });
    return this.flattenLocation(record);
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
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.storage_locations.findMany({
        where,
        include: this.locationInclude,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { location_code: 'asc' },
      }),
      this.prisma.storage_locations.count({ where }),
    ]);
    return { data: this.flattenLocations(data), total, page, limit };
  }

  async findLookup(tenantId: string, facilityId?: bigint) {
    const where: any = { tenant_id: tenantId, is_active: true };
    if (facilityId) where.facility_id = facilityId;
    return this.prisma.storage_locations.findMany({
      where,
      select: { location_id: true, location_name: true, location_code: true },
      orderBy: { location_name: 'asc' },
    });
  }

  async findByBarcode(tenantId: string, barcode: string) {
    const location = await this.prisma.storage_locations.findFirst({
      where: { tenant_id: tenantId, barcode_value: barcode, is_active: true },
      include: this.locationInclude,
    });
    if (!location) {
      const label = await this.prisma.barcode_labels.findFirst({
        where: { tenant_id: tenantId, barcode_value: barcode, entity_type: 'STORAGE_LOCATION', is_active: true },
      });
      if (!label || !label.entity_id) return null;
      const loc = await this.prisma.storage_locations.findFirst({
        where: { tenant_id: tenantId, location_id: BigInt(label.entity_id) },
        include: this.locationInclude,
      });
      return this.flattenLocation(loc);
    }
    return this.flattenLocation(location);
  }

  async findById(tenantId: string, locationId: bigint) {
    const record = await this.prisma.storage_locations.findFirst({
      where: { tenant_id: tenantId, location_id: locationId },
      include: this.locationInclude,
    });
    return this.flattenLocation(record);
  }

  async update(tenantId: string, locationId: bigint, dto: any) {
    const data: any = {};
    if (dto.location_code !== undefined) data.location_code = dto.location_code;
    if (dto.location_name !== undefined) data.location_name = dto.location_name;
    if (dto.location_type !== undefined) data.location_type = dto.location_type;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.length !== undefined) data.length = dto.length;
    if (dto.width !== undefined) data.width = dto.width;
    if (dto.height !== undefined) data.height = dto.height;
    if (dto.max_weight !== undefined) data.max_weight = dto.max_weight;
    if (dto.max_volume !== undefined) data.max_volume = dto.max_volume;
    if (dto.allowed_product_categories_json !== undefined) data.allowed_product_categories_json = dto.allowed_product_categories_json;
    if (dto.allowed_product_attributes_json !== undefined) data.allowed_product_attributes_json = dto.allowed_product_attributes_json;
    if (dto.allowed_storage_conditions_json !== undefined) data.allowed_storage_conditions_json = dto.allowed_storage_conditions_json;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (dto.is_blocked !== undefined) data.is_blocked = dto.is_blocked;
    if (dto.is_reserved !== undefined) data.is_reserved = dto.is_reserved;
    if (dto.location_tier !== undefined) data.location_tier = dto.location_tier;
    if (dto.block_reason !== undefined) data.block_reason = dto.block_reason;
    if (dto.reservation_details_json !== undefined) data.reservation_details_json = dto.reservation_details_json;
    if (dto.pick_sequence_number !== undefined) data.pick_sequence_number = dto.pick_sequence_number;
    if (dto.travel_distance_from_dock !== undefined) data.travel_distance_from_dock = dto.travel_distance_from_dock;
    if (dto.barcode_value !== undefined) data.barcode_value = dto.barcode_value;
    if (dto.qr_code_data !== undefined) data.qr_code_data = dto.qr_code_data;
    if (dto.label_printed_at !== undefined) data.label_printed_at = new Date(dto.label_printed_at);
    if (dto.client_id !== undefined) data.client_id = BigInt(dto.client_id);
    if (dto.bay_number !== undefined) data.bay_number = dto.bay_number;
    await this.prisma.storage_locations.updateMany({
      where: { tenant_id: tenantId, location_id: locationId },
      data,
    });
    return this.findById(tenantId, locationId);
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
    await this.prisma.storage_locations.updateMany({
      where: { tenant_id: tenantId, location_id: locationId },
      data: { is_active: false },
    });
    return this.findById(tenantId, locationId);
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
    const records = await this.prisma.storage_locations.findMany({
      where,
      include: this.locationInclude,
      orderBy: { location_code: 'asc' },
      take: 100,
    });
    return this.flattenLocations(records);
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
