import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StructureService {
  constructor(private readonly prisma: PrismaService) {}

  async createAisle(tenantId: string, dto: any) {
    return this.prisma.aisles.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        zone_id: BigInt(dto.zoneId),
        aisle_code: dto.aisleCode,
        aisle_name: dto.aisleName,
        aisle_number: dto.aisleNumber,
        is_active: dto.isActive ?? true,
      },
    });
  }

  async findAisles(tenantId: string, facilityId: bigint, zoneId?: bigint) {
    const where: any = { tenant_id: tenantId, facility_id: facilityId };
    if (zoneId) where.zone_id = zoneId;
    return this.prisma.aisles.findMany({
      where,
      orderBy: { aisle_code: 'asc' },
    });
  }

  async deleteAisle(tenantId: string, aisleId: bigint) {
    return this.prisma.aisles.updateMany({
      where: { tenant_id: tenantId, aisle_id: aisleId },
      data: { is_active: false },
    });
  }

  async createBay(tenantId: string, dto: any) {
    return this.prisma.bays.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        zone_id: BigInt(dto.zoneId),
        aisle_id: BigInt(dto.aisleId),
        rack_row_id: BigInt(dto.rackRowId),
        bay_code: dto.bayCode,
        bay_name: dto.bayName,
        bay_number: dto.bayNumber,
        is_active: dto.isActive ?? true,
      },
    });
  }

  async findBays(tenantId: string, facilityId: bigint, aisleId: bigint) {
    return this.prisma.bays.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, aisle_id: aisleId },
      orderBy: { bay_code: 'asc' },
    });
  }

  async deleteBay(tenantId: string, bayId: bigint) {
    return this.prisma.bays.updateMany({
      where: { tenant_id: tenantId, bay_id: bayId },
      data: { is_active: false },
    });
  }

  async createRackRow(tenantId: string, dto: any) {
    return this.prisma.rack_rows.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        aisle_id: BigInt(dto.aisleId),
        rack_row_code: dto.rackRowCode,
        rack_row_name: dto.rackRowName,
        total_levels: dto.totalLevels || 1,
        total_bays: dto.totalBays || 1,
        is_active: dto.isActive ?? true,
      },
    });
  }

  async findRackRows(tenantId: string, facilityId: bigint, aisleId: bigint) {
    return this.prisma.rack_rows.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, aisle_id: aisleId },
      orderBy: { rack_row_code: 'asc' },
    });
  }

  async deleteRackRow(tenantId: string, rackRowId: bigint) {
    return this.prisma.rack_rows.updateMany({
      where: { tenant_id: tenantId, rack_row_id: rackRowId },
      data: { is_active: false },
    });
  }

  async createLevel(tenantId: string, dto: any) {
    return this.prisma.rack_levels.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        bay_id: BigInt(dto.bayId),
        level_number: dto.levelNumber,
        level_name: dto.levelName,
        is_active: dto.isActive ?? true,
      },
    });
  }

  async findLevels(tenantId: string, facilityId: bigint, bayId: bigint) {
    return this.prisma.rack_levels.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, bay_id: bayId },
      orderBy: { level_number: 'asc' },
    });
  }

  async deleteLevel(tenantId: string, levelId: bigint) {
    return this.prisma.rack_levels.updateMany({
      where: { tenant_id: tenantId, level_id: levelId },
      data: { is_active: false },
    });
  }

  async createLoadingDock(tenantId: string, dto: any) {
    return this.prisma.loading_docks.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        dock_code: dto.dockCode,
        dock_name: dto.dockName,
        dock_type: dto.dockType || 'RECEIVING',
        is_active: dto.isActive ?? true,
        is_available: dto.isAvailable ?? true,
      },
    });
  }

  async findLoadingDocks(tenantId: string, facilityId: bigint, query: any) {
    const where: any = { tenant_id: tenantId, facility_id: facilityId };
    if (query.dockType) where.dock_type = query.dockType;
    if (query.isAvailable !== undefined) where.is_available = query.isAvailable;
    return this.prisma.loading_docks.findMany({ where, orderBy: { dock_code: 'asc' } });
  }

  async deleteLoadingDock(tenantId: string, dockId: bigint) {
    return this.prisma.loading_docks.updateMany({
      where: { tenant_id: tenantId, dock_id: dockId },
      data: { is_active: false },
    });
  }

  async findLoadingDockById(tenantId: string, dockId: bigint) {
    const dock = await this.prisma.loading_docks.findFirst({
      where: { tenant_id: tenantId, dock_id: dockId },
    });
    if (!dock) throw new NotFoundException('Loading dock not found');
    return dock;
  }

  async updateLoadingDock(tenantId: string, dockId: bigint, dto: any) {
    const data: any = {};
    if (dto.dockCode !== undefined) data.dock_code = dto.dockCode;
    if (dto.dockName !== undefined) data.dock_name = dto.dockName;
    if (dto.dockType !== undefined) data.dock_type = dto.dockType;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.isActive !== undefined) data.is_active = dto.isActive;
    if (dto.isAvailable !== undefined) data.is_available = dto.isAvailable;
    if (dto.maxTrailerLength !== undefined) data.max_trailer_length = dto.maxTrailerLength;
    if (dto.maxTrailerHeight !== undefined) data.max_trailer_height = dto.maxTrailerHeight;
    if (dto.hasLeveler !== undefined) data.has_leveler = dto.hasLeveler;
    if (dto.hasSealant !== undefined) data.has_sealant = dto.hasSealant;
    data.updated_at = new Date();

    const result = await this.prisma.loading_docks.updateMany({
      where: { tenant_id: tenantId, dock_id: dockId },
      data,
    });
    if (!result.count) throw new NotFoundException('Loading dock not found');
    return this.findLoadingDockById(tenantId, dockId);
  }
}
