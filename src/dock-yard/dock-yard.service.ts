import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DockYardService {
  private readonly logger = new Logger(DockYardService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── ENRICHMENT HELPERS ─────────────────────────────────────────────────

  private async enrichAppointment(apt: any): Promise<any> {
    if (!apt) return apt;
    const { facility_id, vendor_id, carrier_id, assigned_dock_id } = apt;
    const [facility, vendor, carrier, dock] = await Promise.all([
      facility_id ? this.prisma.warehouse_facilities.findUnique({ where: { facility_id }, select: { facility_name: true } }) : null,
      vendor_id ? this.prisma.vendors.findUnique({ where: { vendor_id }, select: { vendor_name: true } }) : null,
      carrier_id ? this.prisma.carriers.findUnique({ where: { carrier_id }, select: { carrier_name: true } }) : null,
      assigned_dock_id ? this.prisma.loading_docks.findUnique({ where: { dock_id: assigned_dock_id }, select: { dock_name: true } }) : null,
    ]);
    return { ...apt, facility_name: facility?.facility_name ?? null, vendor_name: vendor?.vendor_name ?? null, carrier_name: carrier?.carrier_name ?? null, dock_name: dock?.dock_name ?? null };
  }

  private async enrichAppointments(apts: any[]): Promise<any[]> {
    if (!apts.length) return apts;
    const facilityIds = apts.map(a => a.facility_id).filter(Boolean);
    const vendorIds = apts.map(a => a.vendor_id).filter(Boolean);
    const carrierIds = apts.map(a => a.carrier_id).filter(Boolean);
    const dockIds = apts.map(a => a.assigned_dock_id).filter(Boolean);
    const facilities: any[] = facilityIds.length ? await this.prisma.warehouse_facilities.findMany({ where: { facility_id: { in: facilityIds } }, select: { facility_id: true, facility_name: true } }) : [];
    const vendors: any[] = vendorIds.length ? await this.prisma.vendors.findMany({ where: { vendor_id: { in: vendorIds } }, select: { vendor_id: true, vendor_name: true } }) : [];
    const carriers: any[] = carrierIds.length ? await this.prisma.carriers.findMany({ where: { carrier_id: { in: carrierIds } }, select: { carrier_id: true, carrier_name: true } }) : [];
    const docks: any[] = dockIds.length ? await this.prisma.loading_docks.findMany({ where: { dock_id: { in: dockIds } }, select: { dock_id: true, dock_name: true } }) : [];
    const fMap = new Map<string, string>();
    const vMap = new Map<string, string>();
    const cMap = new Map<string, string>();
    const dMap = new Map<string, string>();
    facilities.forEach(f => fMap.set(String(f.facility_id), f.facility_name));
    vendors.forEach(v => vMap.set(String(v.vendor_id), v.vendor_name));
    carriers.forEach(c => cMap.set(String(c.carrier_id), c.carrier_name));
    docks.forEach(d => dMap.set(String(d.dock_id), d.dock_name));
    return apts.map(a => ({ ...a, facility_name: fMap.get(String(a.facility_id)) ?? null, vendor_name: vMap.get(String(a.vendor_id)) ?? null, carrier_name: cMap.get(String(a.carrier_id)) ?? null, dock_name: dMap.get(String(a.assigned_dock_id)) ?? null }));
  }

  private async enrichVehicle(v: any): Promise<any> {
    if (!v) return v;
    const facility = v.facility_id ? await this.prisma.warehouse_facilities.findUnique({ where: { facility_id: v.facility_id }, select: { facility_name: true } }) : null;
    return { ...v, facility_name: facility?.facility_name ?? null };
  }

  private async enrichVehicles(vehicles: any[]): Promise<any[]> {
    if (!vehicles.length) return vehicles;
    const facilityIds = vehicles.map(v => v.facility_id).filter(Boolean);
    const facilities: any[] = facilityIds.length ? await this.prisma.warehouse_facilities.findMany({ where: { facility_id: { in: facilityIds } }, select: { facility_id: true, facility_name: true } }) : [];
    const fMap = new Map<string, string>();
    facilities.forEach(f => fMap.set(String(f.facility_id), f.facility_name));
    return vehicles.map(v => ({ ...v, facility_name: fMap.get(String(v.facility_id)) ?? null }));
  }

  // ─── DOCK APPOINTMENTS ──────────────────────────────────────────────────

  async createAppointment(tenantId: string, dto: any) {
    const appointment_number = dto.appointment_number || `APT-${Date.now()}`;
    const apt = await this.prisma.dock_appointments.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        appointment_number,
        appointment_type: dto.appointment_type || 'RECEIVING',
        reference_type: dto.reference_type || null,
        reference_id: dto.reference_id ? BigInt(dto.reference_id) : null,
        vendor_id: dto.vendor_id ? BigInt(dto.vendor_id) : null,
        carrier_id: dto.carrier_id ? BigInt(dto.carrier_id) : null,
        contact_name: dto.contact_name || null,
        contact_phone: dto.contact_phone || null,
        vehicle_type: dto.vehicle_type || null,
        license_plate: dto.license_plate || null,
        requested_date: new Date(dto.requested_date),
        requested_time_slot_start: new Date(dto.time_slot_start),
        requested_time_slot_end: new Date(dto.time_slot_end),
        assigned_dock_id: dto.assigned_dock_id ? BigInt(dto.assigned_dock_id) : null,
        notes: dto.notes || null,
        status: 'REQUESTED',
      },
    });
    return this.enrichAppointment(apt);
  }

  async findAllAppointments(tenantId: string, query: any) {
    const { status, facilityId, date } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId };
    if (status) where.status = status;
    if (facilityId) where.facility_id = BigInt(facilityId);
    if (date) where.requested_date = new Date(date);
    const [data, total] = await Promise.all([
      this.prisma.dock_appointments.findMany({
        where,
        skip,
        take: limit,
        orderBy: { requested_time_slot_start: 'asc' },
      }),
      this.prisma.dock_appointments.count({ where }),
    ]);
    return { data: await this.enrichAppointments(data), total, page, limit };
  }

  async findAppointmentById(tenantId: string, appointmentId: bigint) {
    const apt = await this.prisma.dock_appointments.findFirst({
      where: { tenant_id: tenantId, appointment_id: appointmentId },
    });
    if (!apt) throw new NotFoundException('Appointment not found');
    return this.enrichAppointment(apt);
  }

  async updateAppointment(tenantId: string, appointmentId: bigint, dto: any) {
    await this.findAppointmentById(tenantId, appointmentId);
    const apt = await this.prisma.dock_appointments.update({
      where: { appointment_id: appointmentId },
      data: { ...dto, updated_at: new Date() },
    });
    return this.enrichAppointment(apt);
  }

  /** Check-in: mark arrived, assign dock door, transition to IN_PROGRESS */
  async checkInAppointment(tenantId: string, appointmentId: bigint, dockId?: bigint) {
    const apt = await this.findAppointmentById(tenantId, appointmentId);
    if (apt.status !== 'REQUESTED' && apt.status !== 'CONFIRMED') {
      throw new BadRequestException(`Cannot check-in appointment with status ${apt.status}`);
    }
    const updateData: any = {
      arrived_at: new Date(),
      status: 'IN_PROGRESS',
      updated_at: new Date(),
    };
    if (dockId) updateData.assigned_dock_id = dockId;
    const updated = await this.prisma.dock_appointments.update({
      where: { appointment_id: appointmentId },
      data: updateData,
    });
    return this.enrichAppointment(updated);
  }

  /** Complete: mark finished, transition to COMPLETED */
  async completeAppointment(tenantId: string, appointmentId: bigint) {
    const apt = await this.findAppointmentById(tenantId, appointmentId);
    if (apt.status !== 'IN_PROGRESS') {
      throw new BadRequestException(`Cannot complete appointment with status ${apt.status}`);
    }
    const completed = await this.prisma.dock_appointments.update({
      where: { appointment_id: appointmentId },
      data: {
        finished_at: new Date(),
        status: 'COMPLETED',
        updated_at: new Date(),
      },
    });
    return this.enrichAppointment(completed);
  }

  /** Cancel: transition to CANCELLED */
  async cancelAppointment(tenantId: string, appointmentId: bigint, reason?: string) {
    const apt = await this.findAppointmentById(tenantId, appointmentId);
    if (apt.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel a completed appointment');
    }
    const cancelled = await this.prisma.dock_appointments.update({
      where: { appointment_id: appointmentId },
      data: {
        status: 'CANCELLED',
        notes: reason || apt.notes,
        updated_at: new Date(),
      },
    });
    return this.enrichAppointment(cancelled);
  }

  // ─── YARD VEHICLES ──────────────────────────────────────────────────────

  async createVehicle(tenantId: string, dto: any) {
    const v = await this.prisma.yard_vehicles.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        vehicle_type: dto.vehicle_type || 'TRAILER',
        license_plate: dto.license_plate || null,
        vin: dto.vin || null,
        description: dto.description || null,
        current_location_code: dto.current_location_code || null,
        status: 'IN_YARD',
        arrival_time: new Date(),
        notes: dto.notes || null,
      },
    });
    return this.enrichVehicle(v);
  }

  async findAllVehicles(tenantId: string, query: any) {
    const { status, facilityId } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId };
    if (status) where.status = status;
    if (facilityId) where.facility_id = BigInt(facilityId);
    const [data, total] = await Promise.all([
      this.prisma.yard_vehicles.findMany({
        where,
        skip,
        take: limit,
        orderBy: { arrival_time: 'desc' },
      }),
      this.prisma.yard_vehicles.count({ where }),
    ]);
    return { data: await this.enrichVehicles(data), total, page, limit };
  }

  async findVehicleById(tenantId: string, vehicleId: bigint) {
    const v = await this.prisma.yard_vehicles.findFirst({
      where: { tenant_id: tenantId, vehicle_id: vehicleId },
    });
    if (!v) throw new NotFoundException('Vehicle not found');
    return this.enrichVehicle(v);
  }

  async updateVehicle(tenantId: string, vehicleId: bigint, dto: any) {
    await this.findVehicleById(tenantId, vehicleId);
    const v = await this.prisma.yard_vehicles.update({
      where: { vehicle_id: vehicleId },
      data: { ...dto, updated_at: new Date() },
    });
    return this.enrichVehicle(v);
  }

  /** Assign vehicle to a dock door */
  async assignVehicleToDock(tenantId: string, vehicleId: bigint, appointmentId: bigint) {
    const vehicle = await this.findVehicleById(tenantId, vehicleId);
    if (vehicle.status !== 'IN_YARD' && vehicle.status !== 'LOADING') {
      throw new BadRequestException(`Vehicle ${vehicle.status} cannot be assigned to dock`);
    }
    const assigned = await this.prisma.yard_vehicles.update({
      where: { vehicle_id: vehicleId },
      data: {
        assigned_to_reference_type: 'APPOINTMENT',
        assigned_to_reference_id: appointmentId,
        status: 'LOADING',
        updated_at: new Date(),
      },
    });
    return this.enrichVehicle(assigned);
  }

  /** Depart: mark vehicle as departed, free dock */
  async departVehicle(tenantId: string, vehicleId: bigint) {
    const vehicle = await this.findVehicleById(tenantId, vehicleId);
    if (vehicle.status !== 'LOADING') {
      throw new BadRequestException('Vehicle must be in LOADING status to depart');
    }
    const departed = await this.prisma.yard_vehicles.update({
      where: { vehicle_id: vehicleId },
      data: {
        status: 'DEPARTED',
        departure_time: new Date(),
        assigned_to_reference_type: null,
        assigned_to_reference_id: null,
        updated_at: new Date(),
      },
    });
    return this.enrichVehicle(departed);
  }

  async deleteAppointment(tenantId: string, appointmentId: bigint) {
    return this.prisma.dock_appointments.deleteMany({
      where: { tenant_id: tenantId, appointment_id: appointmentId },
    });
  }

  async deleteVehicle(tenantId: string, vehicleId: bigint) {
    return this.prisma.yard_vehicles.deleteMany({
      where: { tenant_id: tenantId, vehicle_id: vehicleId },
    });
  }

  // ─── RF: UPCOMING APPOINTMENTS ──────────────────────────────────────────

  async getUpcomingAppointments(tenantId: string, facilityId: bigint) {
    const now = new Date();
    const data = await this.prisma.dock_appointments.findMany({
      where: {
        tenant_id: tenantId,
        facility_id: facilityId,
        status: { in: ['REQUESTED', 'CONFIRMED'] },
        requested_time_slot_start: { gte: now },
      },
      orderBy: { requested_time_slot_start: 'asc' },
      take: 20,
    });
    return this.enrichAppointments(data);
  }
}
