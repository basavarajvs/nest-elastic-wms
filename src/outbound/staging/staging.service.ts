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

    // APP-SHIP-H: Mixed-route staging enforcement
    if (lane.lane_type === 'CARRIER' && lane.assigned_carrier_id && lpn.assigned_shipment_id) {
      const shipment = await this.prisma.outbound_shipments.findFirst({
        where: { tenant_id: tenantId, shipment_id: lpn.assigned_shipment_id },
      });
      if (shipment && shipment.carrier_id && shipment.carrier_id !== lane.assigned_carrier_id) {
        throw new BadRequestException(`WRONG STAGING LANE — Carton carrier ${shipment.carrier_id} does not match lane carrier ${lane.assigned_carrier_id}`);
      }
    }
    if (lane.lane_type === 'ROUTE' && lane.assigned_route_id && lpn.assigned_shipment_id) {
      const shipment = await this.prisma.outbound_shipments.findFirst({
        where: { tenant_id: tenantId, shipment_id: lpn.assigned_shipment_id },
      });
      if (shipment && shipment.load_id) {
        const load = await this.prisma.loads.findFirst({ where: { tenant_id: tenantId, load_id: shipment.load_id } });
        if (load && load.route_id && load.route_id !== lane.assigned_route_id) {
          throw new BadRequestException(`WRONG STAGING LANE — Carton route ${load.route_id} does not match lane route ${lane.assigned_route_id}`);
        }
      }
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
        data: { status: 'STAGED', staging_lane_id: laneId },
      });
    }
    // Update staging_work_queue entry
    await this.prisma.staging_work_queue.updateMany({
      where: { tenant_id: tenantId, carton_id: lpnId, status: { in: ['PENDING_STAGE', 'ASSIGNED'] } },
      data: { status: 'STAGED', staged_at: new Date() },
    }).catch(() => {});
    // Write audit event
    await this.prisma.shipping_audit_log.create({
      data: {
        tenant_id: tenantId, event_type: 'CARTON_STAGED', carton_id: lpnId,
        staging_lane_id: laneId, operator_id: userId,
        shipment_id: lpn.assigned_shipment_id || null,
      },
    }).catch(() => {});
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

  // APP-SHIP-G: Undo staging — reverse STAGED → PACKED
  async undoStage(tenantId: string, lpnId: bigint, reasonCode: string) {
    const lpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, lpn_id: lpnId },
    });
    if (!lpn) throw new NotFoundException('Carton not found');
    if (lpn.status !== 'STAGED') throw new BadRequestException('Carton is not STAGED');
    await this.prisma.license_plate_numbers.updateMany({
      where: { tenant_id: tenantId, lpn_id: lpnId },
      data: { status: 'PACKED', staging_location_id: null, staged_at: null },
    });
    // Decrement lane count
    if (lpn.staging_location_id) {
      await this.prisma.staging_lanes.updateMany({
        where: { tenant_id: tenantId, lane_id: lpn.staging_location_id },
        data: { current_carton_count: { decrement: 1 } },
      });
    }
    // Update staging_work_queue
    await this.prisma.staging_work_queue.updateMany({
      where: { tenant_id: tenantId, carton_id: lpnId },
      data: { status: 'PENDING_STAGE' },
    }).catch(() => {});
    // Write audit event
    await this.prisma.shipping_audit_log.create({
      data: {
        tenant_id: tenantId, event_type: 'STAGING_UNDONE', carton_id: lpnId,
        staging_lane_id: lpn.staging_location_id, notes: `Undo reason: ${reasonCode}`,
      },
    }).catch(() => {});
    return { lpnId: lpnId.toString(), status: 'PACKED', message: 'Staging reversed' };
  }

  // APP-SHIP-K: RF lane contents
  async getLaneContentsRF(tenantId: string, facilityId: bigint, laneCode: string) {
    const lane = await this.prisma.staging_lanes.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, lane_code: laneCode },
    });
    if (!lane) throw new NotFoundException('Staging lane not found');
    const cartons = await this.prisma.license_plate_numbers.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, staging_location_id: lane.lane_id, status: 'STAGED' },
      select: { lpn_id: true, lpn_number: true, status: true, assigned_shipment_id: true },
    });
    return {
      laneId: lane.lane_id.toString(), laneCode: lane.lane_code, laneType: lane.lane_type,
      currentCount: lane.current_carton_count, maxCartons: lane.max_cartons,
      cartons: cartons.map(c => ({ lpnId: c.lpn_id.toString(), lpnNumber: c.lpn_number, status: c.status, shipmentId: c.assigned_shipment_id?.toString() })),
    };
  }
}
