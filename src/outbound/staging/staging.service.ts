import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StagingService {
  private readonly logger = new Logger(StagingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getNextStagingWork(tenantId: string, facilityId: bigint, userId: string) {
    const carton = await this.prisma.license_plate_numbers.findFirst({
      where: {
        tenant_id: tenantId,
        facility_id: facilityId,
        status: 'PACKED',
        staging_location_id: null,
        assigned_shipment_id: { not: null },
      },
      orderBy: { staged_at: 'asc' },
    });
    if (!carton) return null;
    const lane = await this.prisma.staging_lanes.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, is_active: true },
      orderBy: { current_carton_count: 'asc' },
    });
    return { carton, suggestedLane: lane };
  }

  async scanCartonForStaging(tenantId: string, facilityId: bigint, cartonBarcode: string) {
    const lpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, lpn_number: cartonBarcode },
    });
    if (!lpn) throw new NotFoundException('Carton not found');
    if (lpn.status !== 'PACKED') throw new BadRequestException(`Carton is ${lpn.status}, must be PACKED`);
    return lpn;
  }

  async moveToStagingLane(tenantId: string, facilityId: bigint, lpnId: bigint, laneId: bigint, userId: string) {
    const lpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, lpn_id: lpnId },
    });
    if (!lpn) throw new NotFoundException('Carton not found');
    const lane = await this.prisma.staging_lanes.findFirst({
      where: { tenant_id: tenantId, lane_id: laneId },
    });
    if (!lane) throw new NotFoundException('Staging lane not found');
    if (lane.max_cartons && (lane.current_carton_count ?? 0) >= lane.max_cartons) {
      throw new BadRequestException('Staging lane is full');
    }
    await this.prisma.license_plate_numbers.updateMany({
      where: { tenant_id: tenantId, lpn_id: lpnId },
      data: { status: 'STAGED', staging_location_id: laneId, staged_at: new Date() },
    });
    await this.prisma.staging_lanes.updateMany({
      where: { tenant_id: tenantId, lane_id: laneId },
      data: { current_carton_count: { increment: 1 } },
    });
    if (lpn.assigned_shipment_id) {
      await this.prisma.outbound_shipments.updateMany({
        where: { tenant_id: tenantId, shipment_id: lpn.assigned_shipment_id },
        data: { status: 'STAGED' },
      });
    }
    return { lpn, lane };
  }

  async verifyStagingLane(tenantId: string, facilityId: bigint, laneBarcode: string) {
    const lane = await this.prisma.staging_lanes.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, lane_code: laneBarcode },
    });
    if (!lane) throw new NotFoundException('Staging lane not found');
    return lane;
  }

  async findAllLanes(tenantId: string, facilityId: bigint) {
    return this.prisma.staging_lanes.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, is_active: true },
      orderBy: { lane_code: 'asc' },
    });
  }

  async createLane(tenantId: string, dto: any) {
    return this.prisma.staging_lanes.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        lane_code: dto.laneCode,
        lane_type: dto.laneType || 'CARRIER',
        description: dto.description,
        zone_id: dto.zoneId ? BigInt(dto.zoneId) : undefined,
        assigned_carrier_id: dto.assignedCarrierId ? BigInt(dto.assignedCarrierId) : undefined,
        assigned_door_id: dto.assignedDoorId ? BigInt(dto.assignedDoorId) : undefined,
        max_cartons: dto.maxCartons,
        current_carton_count: 0,
        is_active: dto.isActive ?? true,
      },
    });
  }

  async getLaneContents(tenantId: string, facilityId: bigint, laneId: bigint) {
    const cartons = await this.prisma.license_plate_numbers.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, staging_location_id: laneId, status: 'STAGED' },
    });
    const lane = await this.prisma.staging_lanes.findFirst({
      where: { tenant_id: tenantId, lane_id: laneId },
    });
    return { lane, cartons, cartonCount: cartons.length };
  }
}
