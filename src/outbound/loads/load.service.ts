import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LoadService {
  private readonly logger = new Logger(LoadService.name);

  constructor(private readonly prisma: PrismaService) {}

  async delete(tenantId: string, loadId: bigint) {
    const load = await this.findById(tenantId, loadId);
    await this.prisma.loads.deleteMany({
      where: { tenant_id: tenantId, load_id: loadId },
    });
    return load;
  }

  async create(tenantId: string, dto: any) {
    return this.prisma.loads.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        load_number: dto.load_number || `LOAD-${Date.now()}`,
        load_name: dto.load_name,
        description: dto.description,
        vehicle_number: dto.vehicle_number,
        driver_name: dto.driver_name,
        driver_phone: dto.driver_phone,
        carrier_id: dto.carrierId ? BigInt(dto.carrierId) : undefined,
        carrier_code: dto.carrier_code,
        carrier_name: dto.carrier_name,
        service_type: dto.service_type,
        trailer_number: dto.trailer_number,
        dock_door_number: dto.dock_door_number,
        planned_departure_date: dto.planned_departure_date ? new Date(dto.planned_departure_date) : undefined,
        planned_departure_time: dto.planned_departure_time ? new Date(dto.planned_departure_time) : undefined,
        planned_arrival_date: dto.planned_arrival_date ? new Date(dto.planned_arrival_date) : undefined,
        planned_arrival_time: dto.planned_arrival_time ? new Date(dto.planned_arrival_time) : undefined,
        weight_uom: dto.weight_uom,
        volume_uom: dto.volume_uom,
        total_cartons: dto.total_cartons,
        total_weight: dto.total_weight,
        total_volume: dto.total_volume,
        number_of_packages: dto.number_of_packages,
        multi_stop: dto.multi_stop,
        bol_number: dto.bol_number,
        pro_number: dto.pro_number,
        seal_number: dto.seal_number,
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
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [rows, total] = await Promise.all([
      this.prisma.loads.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { planned_departure_date: 'asc' },
        include: { warehouse_facilities: true },
      }),
      this.prisma.loads.count({ where }),
    ]);
    const data = rows.map(r => ({
      ...r,
      facility_name: r.warehouse_facilities?.facility_name,
      warehouse_facilities: undefined,
    }));
    return { data, total, page, limit };
  }

  async findById(tenantId: string, loadId: bigint) {
    const load = await this.prisma.loads.findFirst({
      where: { tenant_id: tenantId, load_id: loadId },
      include: { warehouse_facilities: true },
    });
    if (!load) return null;
    const shipments = await this.prisma.outbound_shipments.findMany({
      where: { tenant_id: tenantId, load_id: loadId },
    });
    return {
      ...load,
      facility_name: load.warehouse_facilities?.facility_name,
      warehouse_facilities: undefined,
      shipments,
    };
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

    const loadedCartons = dto.loaded_cartons || load.loaded_cartons || 0;

    await this.prisma.loads.updateMany({
      where: { tenant_id: tenantId, load_id: loadId },
      data: {
        status: 'LOADED',
        load_completed_time: new Date(),
        loaded_cartons: loadedCartons,
        seal_number: dto.seal_number || load.seal_number,
        bol_number: dto.bol_number || load.bol_number,
        pro_number: dto.pro_number || load.pro_number,
        actual_departure_time: dto.actual_departure_time ? new Date(dto.actual_departure_time) : new Date(),
        loaded_by: dto.loaded_by,
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

  // GAP-7: Carrier handoff
  async transferToCarrier(tenantId: string, loadId: bigint, driverName: string) {
    const load = await this.prisma.loads.findFirst({ where: { tenant_id: tenantId, load_id: loadId } });
    if (!load) throw new BadRequestException('Load not found');
    await this.prisma.loads.updateMany({
      where: { tenant_id: tenantId, load_id: loadId },
      data: { status: 'DEPARTED', actual_departure_time: new Date(), driver_name: driverName },
    });
    await this.prisma.license_plate_numbers.updateMany({
      where: { tenant_id: tenantId, assigned_load_id: loadId, status: 'LOADED' },
      data: { status: 'SHIPPED', updated_at: new Date() },
    });
    return { loadId, status: 'DEPARTED', driverName, handedOffAt: new Date() };
  }

  // GAP-6: Capacity validation
  async validateCapacity(tenantId: string, loadId: bigint, newCartonWeightKg: number) {
    const load = await this.prisma.loads.findFirst({ where: { tenant_id: tenantId, load_id: loadId } });
    if (!load) throw new BadRequestException('Load not found');
    const currentWeight = Number(load.total_weight || 0);
    const newTotal = currentWeight + newCartonWeightKg;
    const maxWeight = 20000;
    if (newTotal > maxWeight) {
      return { allowed: false, message: 'OVER CAPACITY: Weight limit exceeded', currentWeight, newTotal, maxWeight };
    }
    return { allowed: true, currentWeight, newTotal, maxWeight };
  }

  // GAP-2: Directed loading work
  async getNextLoadingWork(tenantId: string, facilityId: bigint, userId: string) {
    const loads = await this.prisma.loads.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, status: { in: ['PLANNED', 'READY'] } },
      orderBy: { planned_departure_date: 'asc' },
      take: 1,
    });
    if (!loads.length) return null;
    const load = loads[0];
    const docks = await this.prisma.loading_docks.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, is_active: true, is_available: true }, take: 1,
    });
    const trailers = await this.prisma.trailers.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, is_active: true, status: { in: ['ARRIVED', 'AT_DOCK'] } }, take: 1,
    });
    const shipmentCount = await this.prisma.outbound_shipments.count({
      where: { tenant_id: tenantId, load_id: load.load_id },
    });
    return { load, dock: docks[0] || null, trailer: trailers[0] || null, shipmentCount };
  }

  // GAP-4.2: Get loading sequence for multi-stop loads (reverse order)
  async getLoadingSequence(tenantId: string, loadId: bigint) {
    const load = await this.prisma.loads.findFirst({ where: { tenant_id: tenantId, load_id: loadId } });
    if (!load) throw new BadRequestException('Load not found');
    const stops = await this.prisma.load_stops.findMany({
      where: { tenant_id: tenantId, load_id: loadId },
      orderBy: { stop_sequence: 'desc' }, // Reverse: last stop loaded first
    });
    return {
      loadId: load.load_id.toString(),
      loadNumber: load.load_number,
      multiStop: load.multi_stop || false,
      totalStops: load.total_stops || stops.length,
      currentStopLoading: load.current_stop_loading || 1,
      stops: stops.map(s => ({
        stopId: s.stop_id.toString(),
        sequence: s.stop_sequence,
        locationName: s.location_name,
        shipmentId: s.shipment_id?.toString(),
        status: s.status,
      })),
    };
  }

  // GAP-4.2: Advance to next stop
  async advanceToNextStop(tenantId: string, loadId: bigint) {
    const load = await this.prisma.loads.findFirst({ where: { tenant_id: tenantId, load_id: loadId } });
    if (!load) throw new BadRequestException('Load not found');
    const current = load.current_stop_loading || 1;
    const total = load.total_stops || 1;
    if (current >= total) {
      return { loadId: loadId.toString(), currentStop: current, totalStops: total, message: 'Already at last stop' };
    }
    const nextStop = current + 1;
    await this.prisma.loads.updateMany({
      where: { tenant_id: tenantId, load_id: loadId },
      data: { current_stop_loading: nextStop },
    });
    // Mark previous stop as loaded
    await this.prisma.load_stops.updateMany({
      where: { tenant_id: tenantId, load_id: loadId, stop_sequence: current },
      data: { status: 'LOADED' },
    });
    return { loadId: loadId.toString(), currentStop: nextStop, totalStops: total, message: `Advanced to stop ${nextStop} of ${total}` };
  }

  // APP-SHIP-E: Create load stops from a route template
  async createLoadStopsFromRoute(tenantId: string, loadId: bigint, routeId: bigint) {
    const routeStops = await this.prisma.route_stops.findMany({
      where: { tenant_id: tenantId, route_id: routeId, is_active: true },
      orderBy: { stop_sequence: 'asc' },
    });
    for (const rs of routeStops) {
      await this.prisma.load_stops.create({
        data: {
          tenant_id: tenantId,
          load_id: loadId,
          stop_sequence: rs.stop_sequence,
          location_name: rs.location_name,
          planned_arrival: rs.planned_arrival,
          planned_departure: rs.planned_departure,
          status: 'PENDING',
        },
      });
    }
    await this.prisma.loads.updateMany({
      where: { tenant_id: tenantId, load_id: loadId },
      data: { multi_stop: true, total_stops: routeStops.length, current_stop_loading: 1, route_id: routeId },
    });
    return { loadId: loadId.toString(), stopsCreated: routeStops.length };
  }

  // APP-SHIP-G: Undo last carton load
  async undoLoad(tenantId: string, loadId: bigint, lpnId: bigint, reasonCode: string) {
    const lpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, lpn_id: lpnId },
    });
    if (!lpn) throw new BadRequestException('LPN not found');
    if (lpn.status !== 'LOADED') throw new BadRequestException('LPN is not LOADED');
    // Reverse: LOADED → STAGED, decrement carton count
    await this.prisma.license_plate_numbers.updateMany({
      where: { tenant_id: tenantId, lpn_id: lpnId },
      data: { status: 'STAGED', assigned_load_id: null, loaded_at: null },
    });
    await this.prisma.loads.updateMany({
      where: { tenant_id: tenantId, load_id: loadId },
      data: { loaded_cartons: { decrement: 1 } },
    });
    // Write audit event
    await this.prisma.shipping_audit_log.create({
      data: {
        tenant_id: tenantId,
        event_type: 'CARTON_LOAD_UNDONE',
        load_id: loadId,
        carton_id: lpnId,
        operator_id: null,
        notes: `Undo reason: ${reasonCode}`,
      },
    }).catch(() => {});
    return { loadId: loadId.toString(), lpnId: lpnId.toString(), status: 'STAGED', message: 'Carton load reversed' };
  }

  // APP-SHIP-F: Persist BOL to table
  async persistBol(tenantId: string, loadId: bigint, generatedBy: string) {
    const bolData = await this.generateBol(tenantId, loadId);
    const bolNumber = bolData.bolNumber || `BOL-${loadId}-${Date.now()}`;
    await this.prisma.bill_of_lading.create({
      data: {
        tenant_id: tenantId,
        load_id: loadId,
        bol_number: bolNumber,
        vehicle_number: bolData.vehicleNumber,
        trailer_number: bolData.trailerNumber,
        seal_number: bolData.sealNumber,
        total_weight_kg: bolData.totalWeight,
        total_cartons: bolData.totalCartons,
        driver_name: bolData.driverName,
        generated_by: generatedBy,
      },
    }).catch(() => {});
    return { ...bolData, bolNumber };
  }

  // GAP-4: Create a single load stop
  async createStop(tenantId: string, loadId: bigint, dto: any) {
    const stop = await this.prisma.load_stops.create({
      data: {
        tenant_id: tenantId,
        load_id: loadId,
        stop_sequence: dto.stop_sequence || 1,
        location_name: dto.location_name,
        shipment_id: dto.shipment_id ? BigInt(dto.shipment_id) : null,
        planned_arrival: dto.planned_arrival ? new Date(dto.planned_arrival) : null,
        planned_departure: dto.planned_departure ? new Date(dto.planned_departure) : null,
        status: 'PENDING',
      },
    });
    // Update load multi-stop flag
    const stopCount = await this.prisma.load_stops.count({ where: { tenant_id: tenantId, load_id: loadId } });
    if (stopCount > 1) {
      await this.prisma.loads.updateMany({
        where: { tenant_id: tenantId, load_id: loadId },
        data: { multi_stop: true, total_stops: stopCount },
      });
    }
    return stop;
  }
}
