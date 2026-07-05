import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LoadService {
  private readonly logger = new Logger(LoadService.name);

  constructor(private readonly prisma: PrismaService) {}

  async delete(tenantId: string, loadId: bigint) {
    return this.prisma.loads.deleteMany({
      where: { tenant_id: tenantId, load_id: loadId },
    });
  }

  async create(tenantId: string, dto: any) {
    return this.prisma.loads.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        load_number: dto.loadNumber || `LOAD-${Date.now()}`,
        load_name: dto.loadName,
        vehicle_number: dto.vehicleNumber,
        driver_name: dto.driverName,
        driver_phone: dto.driverPhone,
        carrier_id: dto.carrierId ? BigInt(dto.carrierId) : undefined,
        carrier_code: dto.carrierCode,
        carrier_name: dto.carrierName,
        service_type: dto.serviceType,
        trailer_number: dto.trailerNumber,
        dock_door_number: dto.dockDoorNumber,
        planned_departure_date: dto.plannedDepartureDate ? new Date(dto.plannedDepartureDate) : undefined,
        planned_departure_time: dto.plannedDepartureTime ? new Date(dto.plannedDepartureTime) : undefined,
        planned_arrival_date: dto.plannedArrivalDate ? new Date(dto.plannedArrivalDate) : undefined,
        planned_arrival_time: dto.plannedArrivalTime ? new Date(dto.plannedArrivalTime) : undefined,
        bol_number: dto.bolNumber,
        pro_number: dto.proNumber,
        seal_number: dto.sealNumber,
        notes: dto.notes,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, facility_id: BigInt(query.facilityId) };
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { load_number: { contains: query.search, mode: 'insensitive' } },
        { driver_name: { contains: query.search, mode: 'insensitive' } },
        { vehicle_number: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.loads.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { planned_departure_date: 'asc' },
      }),
      this.prisma.loads.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, loadId: bigint) {
    const load = await this.prisma.loads.findFirst({
      where: { tenant_id: tenantId, load_id: loadId },
    });
    if (!load) return null;
    const shipments = await this.prisma.outbound_shipments.findMany({
      where: { tenant_id: tenantId, load_id: loadId },
    });
    return { ...load, shipments };
  }

  /** Assign shipment to this load */
  async assignShipment(tenantId: string, loadId: bigint, shipmentId: bigint) {
    const load = await this.prisma.loads.findFirst({
      where: { tenant_id: tenantId, load_id: loadId },
    });
    if (!load) throw new BadRequestException('Load not found');

    const shipment = await this.prisma.outbound_shipments.findFirst({
      where: { tenant_id: tenantId, shipment_id: shipmentId },
    });
    if (!shipment) throw new BadRequestException('Shipment not found');

    await this.prisma.outbound_shipments.updateMany({
      where: { tenant_id: tenantId, shipment_id: shipmentId },
      data: { load_id: loadId, status: 'LOADED' },
    });

    const existing = await this.prisma.load_shipments.findFirst({
      where: { tenant_id: tenantId, load_id: loadId, shipment_id: shipmentId },
    });
    if (!existing) {
      await this.prisma.load_shipments.create({
        data: {
          tenant_id: tenantId,
          facility_id: load.facility_id,
          load_id: loadId,
          shipment_id: shipmentId,
        },
      });
    }

    await this.updateLoadTotals(tenantId, loadId);
    return this.findById(tenantId, loadId);
  }

  /** Remove shipment from load */
  async removeShipment(tenantId: string, loadId: bigint, shipmentId: bigint) {
    await this.prisma.outbound_shipments.updateMany({
      where: { tenant_id: tenantId, shipment_id: shipmentId },
      data: { load_id: null, status: 'STAGED' },
    });

    await this.prisma.load_shipments.deleteMany({
      where: { tenant_id: tenantId, load_id: loadId, shipment_id: shipmentId },
    });

    await this.updateLoadTotals(tenantId, loadId);
    return this.findById(tenantId, loadId);
  }

  /** Start loading process at dock door */
  async startLoading(tenantId: string, loadId: bigint) {
    const load = await this.prisma.loads.findFirst({
      where: { tenant_id: tenantId, load_id: loadId },
    });
    if (!load) throw new BadRequestException('Load not found');
    if (load.status !== 'PLANNED' && load.status !== 'READY') {
      throw new BadRequestException('Load must be PLANNED or READY to start loading');
    }

    await this.prisma.loads.updateMany({
      where: { tenant_id: tenantId, load_id: loadId },
      data: { status: 'LOADING', load_start_time: new Date() },
    });

    return this.findById(tenantId, loadId);
  }

  /** Complete loading, generate BOL */
  async completeLoading(tenantId: string, loadId: bigint, dto: any) {
    const load = await this.prisma.loads.findFirst({
      where: { tenant_id: tenantId, load_id: loadId },
    });
    if (!load) throw new BadRequestException('Load not found');

    const loadedCartons = dto.loadedCartons || load.loaded_cartons || 0;

    await this.prisma.loads.updateMany({
      where: { tenant_id: tenantId, load_id: loadId },
      data: {
        status: 'LOADED',
        load_completed_time: new Date(),
        loaded_cartons: loadedCartons,
        seal_number: dto.sealNumber || load.seal_number,
        bol_number: dto.bolNumber || load.bol_number,
        pro_number: dto.proNumber || load.pro_number,
        actual_departure_time: dto.actualDepartureTime ? new Date(dto.actualDepartureTime) : new Date(),
        loaded_by: dto.loadedBy,
      },
    });

    return this.findById(tenantId, loadId);
  }

  /** Close load — mark as departed */
  async departLoad(tenantId: string, loadId: bigint) {
    const load = await this.prisma.loads.findFirst({
      where: { tenant_id: tenantId, load_id: loadId },
    });
    if (!load) throw new BadRequestException('Load not found');

    await this.prisma.loads.updateMany({
      where: { tenant_id: tenantId, load_id: loadId },
      data: { status: 'DEPARTED', actual_departure_time: new Date() },
    });

    // Update all LPNS on this load to SHIPPED
    await this.prisma.license_plate_numbers.updateMany({
      where: { tenant_id: tenantId, assigned_load_id: loadId },
      data: { status: 'SHIPPED' },
    });

    return this.findById(tenantId, loadId);
  }

  /** Generate BOL document data */
  async generateBol(tenantId: string, loadId: bigint) {
    const load = await this.prisma.loads.findFirst({
      where: { tenant_id: tenantId, load_id: loadId },
    });
    if (!load) throw new BadRequestException('Load not found');

    const shipments = await this.prisma.outbound_shipments.findMany({
      where: { tenant_id: tenantId, load_id: loadId },
    });

    return {
      bolNumber: load.bol_number || `BOL-${load.load_number}`,
      loadNumber: load.load_number,
      carrierName: load.carrier_name,
      carrierCode: load.carrier_code,
      vehicleNumber: load.vehicle_number,
      trailerNumber: load.trailer_number,
      driverName: load.driver_name,
      driverPhone: load.driver_phone,
      dockDoorNumber: load.dock_door_number,
      sealNumber: load.seal_number,
      plannedDeparture: load.planned_departure_time,
      actualDeparture: load.actual_departure_time,
      totalWeight: load.total_weight,
      totalCartons: load.total_cartons,
      loadedCartons: load.loaded_cartons,
      numberOfShipments: shipments.length,
      shipments: shipments.map((s) => ({
        shipmentNumber: s.shipment_number,
        trackingNumber: s.tracking_number,
        proNumber: s.pro_number,
        totalCartons: s.total_cartons,
        totalWeight: s.total_weight,
        deliveryCity: s.delivery_city,
        deliveryState: s.delivery_state_province,
      })),
      generatedAt: new Date(),
    };
  }

  private async updateLoadTotals(tenantId: string, loadId: bigint) {
    const shipments = await this.prisma.outbound_shipments.findMany({
      where: { tenant_id: tenantId, load_id: loadId },
    });
    const totalWeight = shipments.reduce((s, sh) => s + Number(sh.total_weight || 0), 0);
    const totalCartons = shipments.reduce((s, sh) => s + Number(sh.total_cartons || 0), 0);
    await this.prisma.loads.updateMany({
      where: { tenant_id: tenantId, load_id: loadId },
      data: {
        total_weight: totalWeight,
        total_cartons: totalCartons,
        number_of_shipments: shipments.length,
      },
    });
  }
}
