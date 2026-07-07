import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StructureService {
  constructor(private readonly prisma: PrismaService) {}

  async createAisle(tenantId: string, dto: any) {
    const record = await this.prisma.aisles.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        zone_id: BigInt(dto.zone_id),
        aisle_code: dto.aisle_code,
        aisle_name: dto.aisle_name,
        aisle_number: dto.aisle_number,
        width_meters: dto.width_meters,
        length_meters: dto.length_meters,
        picking_direction: dto.picking_direction,
        start_sequence_number: dto.start_sequence_number,
        is_active: dto.is_active ?? true,
        is_blocked: dto.is_blocked,
        block_reason: dto.block_reason,
        allowed_equipment_types_json: dto.allowed_equipment_types_json,
        max_equipment_height_cm: dto.max_equipment_height_cm,
      },
      include: {
        warehouse_facilities: { select: { facility_name: true } },
        warehouse_zones: { select: { zone_name: true } },
      },
    });
    return this.flattenAisle(record);
  }

  async findAisles(tenantId: string, facilityId: bigint, zoneId?: bigint) {
    const where: any = { tenant_id: tenantId, facility_id: facilityId };
    if (zoneId) where.zone_id = zoneId;
    const records = await this.prisma.aisles.findMany({
      where,
      include: {
        warehouse_facilities: { select: { facility_name: true } },
        warehouse_zones: { select: { zone_name: true } },
      },
      orderBy: { aisle_code: 'asc' },
    });
    return records.map(r => this.flattenAisle(r));
  }

  async deleteAisle(tenantId: string, aisleId: bigint) {
    await this.prisma.aisles.updateMany({
      where: { tenant_id: tenantId, aisle_id: aisleId },
      data: { is_active: false },
    });
    const record = await this.prisma.aisles.findFirst({
      where: { tenant_id: tenantId, aisle_id: aisleId },
      include: {
        warehouse_facilities: { select: { facility_name: true } },
        warehouse_zones: { select: { zone_name: true } },
      },
    });
    return this.flattenAisle(record);
  }

  private flattenAisle(record: any) {
    if (!record) return null;
    const { warehouse_facilities, warehouse_zones, ...rest } = record;
    return {
      ...rest,
      facility_name: warehouse_facilities?.facility_name || null,
      zone_name: warehouse_zones?.zone_name || null,
    };
  }

  async createBay(tenantId: string, dto: any) {
    const record = await this.prisma.bays.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        zone_id: BigInt(dto.zone_id),
        aisle_id: BigInt(dto.aisle_id),
        rack_row_id: BigInt(dto.rack_row_id),
        bay_code: dto.bay_code,
        bay_name: dto.bay_name,
        bay_number: dto.bay_number,
        length_meters: dto.length_meters,
        side: dto.side,
        position_start_meters: dto.position_start_meters,
        is_active: dto.is_active ?? true,
        is_reserved: dto.is_reserved,
        reservation_notes: dto.reservation_notes,
        positions_per_level: dto.positions_per_level ?? 2,
        status: dto.status,
      },
      include: {
        warehouse_facilities: { select: { facility_name: true } },
        warehouse_zones: { select: { zone_name: true } },
        aisles: { select: { aisle_name: true, aisle_code: true } },
      },
    });
    return this.flattenBay(record);
  }

  async findBays(tenantId: string, facilityId: bigint, aisleId: bigint) {
    const records = await this.prisma.bays.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, aisle_id: aisleId },
      include: {
        warehouse_facilities: { select: { facility_name: true } },
        warehouse_zones: { select: { zone_name: true } },
        aisles: { select: { aisle_name: true, aisle_code: true } },
      },
      orderBy: { bay_code: 'asc' },
    });
    return records.map(r => this.flattenBay(r));
  }

  async deleteBay(tenantId: string, bayId: bigint) {
    await this.prisma.bays.updateMany({
      where: { tenant_id: tenantId, bay_id: bayId },
      data: { is_active: false },
    });
    const record = await this.prisma.bays.findFirst({
      where: { tenant_id: tenantId, bay_id: bayId },
      include: {
        warehouse_facilities: { select: { facility_name: true } },
        warehouse_zones: { select: { zone_name: true } },
        aisles: { select: { aisle_name: true, aisle_code: true } },
      },
    });
    return this.flattenBay(record);
  }

  private flattenBay(record: any) {
    if (!record) return null;
    const { warehouse_facilities, warehouse_zones, aisles, ...rest } = record;
    return {
      ...rest,
      facility_name: warehouse_facilities?.facility_name || null,
      zone_name: warehouse_zones?.zone_name || null,
      aisle_name: aisles?.aisle_name || aisles?.aisle_code || null,
    };
  }

  async createRackRow(tenantId: string, dto: any) {
    const record = await this.prisma.rack_rows.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        aisle_id: BigInt(dto.aisle_id),
        rack_row_code: dto.rack_row_code,
        rack_row_name: dto.rack_row_name,
        description: dto.description,
        length: dto.length,
        width: dto.width,
        height: dto.height,
        total_levels: dto.total_levels || 1,
        total_bays: dto.total_bays || 1,
        total_capacity: dto.total_capacity,
        weight_capacity_per_level: dto.weight_capacity_per_level,
        zone_id: dto.zone_id ? BigInt(dto.zone_id) : undefined,
        barcode_value: dto.barcode_value,
        qr_code_data: dto.qr_code_data,
        is_active: dto.is_active ?? true,
      },
      include: {
        warehouse_facilities: { select: { facility_name: true } },
      },
    });
    return this.flattenRackRow(record);
  }

  async findRackRows(tenantId: string, facilityId: bigint, aisleId: bigint) {
    const records = await this.prisma.rack_rows.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, aisle_id: aisleId },
      include: {
        warehouse_facilities: { select: { facility_name: true } },
      },
      orderBy: { rack_row_code: 'asc' },
    });
    return records.map(r => this.flattenRackRow(r));
  }

  async deleteRackRow(tenantId: string, rackRowId: bigint) {
    await this.prisma.rack_rows.updateMany({
      where: { tenant_id: tenantId, rack_row_id: rackRowId },
      data: { is_active: false },
    });
    const record = await this.prisma.rack_rows.findFirst({
      where: { tenant_id: tenantId, rack_row_id: rackRowId },
      include: {
        warehouse_facilities: { select: { facility_name: true } },
      },
    });
    return this.flattenRackRow(record);
  }

  private flattenRackRow(record: any) {
    if (!record) return null;
    const { warehouse_facilities, ...rest } = record;
    return {
      ...rest,
      facility_name: warehouse_facilities?.facility_name || null,
    };
  }

  async createLevel(tenantId: string, dto: any) {
    const record = await this.prisma.rack_levels.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        bay_id: BigInt(dto.bay_id),
        level_number: dto.level_number,
        level_name: dto.level_name,
        description: dto.description,
        height: dto.height,
        width: dto.width,
        depth: dto.depth,
        weight_capacity: dto.weight_capacity,
        volume_capacity: dto.volume_capacity,
        is_active: dto.is_active ?? true,
      },
      include: {
        warehouse_facilities: { select: { facility_name: true } },
        bays: { select: { bay_code: true } },
      },
    });
    return this.flattenLevel(record);
  }

  async findLevels(tenantId: string, facilityId: bigint, bayId: bigint) {
    const records = await this.prisma.rack_levels.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, bay_id: bayId },
      include: {
        warehouse_facilities: { select: { facility_name: true } },
        bays: { select: { bay_code: true } },
      },
      orderBy: { level_number: 'asc' },
    });
    return records.map(r => this.flattenLevel(r));
  }

  async deleteLevel(tenantId: string, levelId: bigint) {
    await this.prisma.rack_levels.updateMany({
      where: { tenant_id: tenantId, level_id: levelId },
      data: { is_active: false },
    });
    const record = await this.prisma.rack_levels.findFirst({
      where: { tenant_id: tenantId, level_id: levelId },
      include: {
        warehouse_facilities: { select: { facility_name: true } },
        bays: { select: { bay_code: true } },
      },
    });
    return this.flattenLevel(record);
  }

  private flattenLevel(record: any) {
    if (!record) return null;
    const { warehouse_facilities, bays, ...rest } = record;
    return {
      ...rest,
      facility_name: warehouse_facilities?.facility_name || null,
      bay_code: bays?.bay_code || null,
    };
  }

  async createLoadingDock(tenantId: string, dto: any) {
    const record = await this.prisma.loading_docks.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        dock_code: dto.dock_code,
        dock_name: dto.dock_name,
        dock_type: dto.dock_type || 'RECEIVING',
        description: dto.description,
        location_id: dto.location_id ? BigInt(dto.location_id) : undefined,
        max_trailer_length: dto.max_trailer_length,
        max_trailer_height: dto.max_trailer_height,
        has_leveler: dto.has_leveler,
        has_sealant: dto.has_sealant,
        is_active: dto.is_active ?? true,
        is_available: dto.is_available ?? true,
      },
      include: {
        warehouse_facilities: { select: { facility_name: true } },
      },
    });
    return this.flattenLoadingDock(record);
  }

  async findLoadingDocks(tenantId: string, facilityId: bigint, query: any) {
    const where: any = { tenant_id: tenantId, facility_id: facilityId };
    if (query.dockType) where.dock_type = query.dockType;
    if (query.isAvailable !== undefined) where.is_available = query.isAvailable;
    const records = await this.prisma.loading_docks.findMany({
      where,
      include: { warehouse_facilities: { select: { facility_name: true } } },
      orderBy: { dock_code: 'asc' },
    });
    return records.map(r => this.flattenLoadingDock(r));
  }

  async deleteLoadingDock(tenantId: string, dockId: bigint) {
    await this.prisma.loading_docks.updateMany({
      where: { tenant_id: tenantId, dock_id: dockId },
      data: { is_active: false },
    });
    const record = await this.prisma.loading_docks.findFirst({
      where: { tenant_id: tenantId, dock_id: dockId },
      include: { warehouse_facilities: { select: { facility_name: true } } },
    });
    return this.flattenLoadingDock(record);
  }

  async findLoadingDockById(tenantId: string, dockId: bigint) {
    const dock = await this.prisma.loading_docks.findFirst({
      where: { tenant_id: tenantId, dock_id: dockId },
      include: { warehouse_facilities: { select: { facility_name: true } } },
    });
    if (!dock) throw new NotFoundException('Loading dock not found');
    return this.flattenLoadingDock(dock);
  }

  async updateLoadingDock(tenantId: string, dockId: bigint, dto: any) {
    const data: any = {};
    if (dto.dock_code !== undefined) data.dock_code = dto.dock_code;
    if (dto.dock_name !== undefined) data.dock_name = dto.dock_name;
    if (dto.dock_type !== undefined) data.dock_type = dto.dock_type;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (dto.is_available !== undefined) data.is_available = dto.is_available;
    if (dto.max_trailer_length !== undefined) data.max_trailer_length = dto.max_trailer_length;
    if (dto.max_trailer_height !== undefined) data.max_trailer_height = dto.max_trailer_height;
    if (dto.has_leveler !== undefined) data.has_leveler = dto.has_leveler;
    if (dto.has_sealant !== undefined) data.has_sealant = dto.has_sealant;
    data.updated_at = new Date();

    await this.prisma.loading_docks.updateMany({
      where: { tenant_id: tenantId, dock_id: dockId },
      data,
    });
    return this.findLoadingDockById(tenantId, dockId);
  }

  private flattenLoadingDock(record: any) {
    if (!record) return null;
    const { warehouse_facilities, ...rest } = record;
    return {
      ...rest,
      facility_name: warehouse_facilities?.facility_name || null,
    };
  }
}
