import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DockYardService {
  private readonly logger = new Logger(DockYardService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── DOCK APPOINTMENTS ──────────────────────────────────────────────────

  async createAppointment(tenantId: string, dto: any) {
    const appointment_number = dto.appointmentNumber || `APT-${Date.now()}`;
    return this.prisma.dock_appointments.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        appointment_number,
        appointment_type: dto.appointmentType || 'RECEIVING',
        reference_type: dto.referenceType || null,
        reference_id: dto.referenceId ? BigInt(dto.referenceId) : null,
        vendor_id: dto.vendorId ? BigInt(dto.vendorId) : null,
        carrier_id: dto.carrierId ? BigInt(dto.carrierId) : null,
        contact_name: dto.contactName || null,
        contact_phone: dto.contactPhone || null,
        vehicle_type: dto.vehicleType || null,
        license_plate: dto.licensePlate || null,
        requested_date: new Date(dto.requestedDate),
        requested_time_slot_start: new Date(dto.timeSlotStart),
        requested_time_slot_end: new Date(dto.timeSlotEnd),
        assigned_dock_id: dto.assignedDockId ? BigInt(dto.assignedDockId) : null,
        status: 'REQUESTED',
        created_by: dto.createdBy || null,
      },
    });
  }

  async findAllAppointments(tenantId: string, query: any) {
    const { status, facilityId, date, page = 1, limit = 50 } = query;
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
    return { data, total, page, limit };
  }

  async findAppointmentById(tenantId: string, appointmentId: bigint) {
    const apt = await this.prisma.dock_appointments.findFirst({
      where: { tenant_id: tenantId, appointment_id: appointmentId },
    });
    if (!apt) throw new NotFoundException('Appointment not found');
    return apt;
  }

  async updateAppointment(tenantId: string, appointmentId: bigint, dto: any) {
    await this.findAppointmentById(tenantId, appointmentId);
    return this.prisma.dock_appointments.update({
      where: { appointment_id: appointmentId },
      data: { ...dto, updated_at: new Date() },
    });
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
    return this.prisma.dock_appointments.update({
      where: { appointment_id: appointmentId },
      data: updateData,
    });
  }

  /** Complete: mark finished, transition to COMPLETED */
  async completeAppointment(tenantId: string, appointmentId: bigint) {
    const apt = await this.findAppointmentById(tenantId, appointmentId);
    if (apt.status !== 'IN_PROGRESS') {
      throw new BadRequestException(`Cannot complete appointment with status ${apt.status}`);
    }
    return this.prisma.dock_appointments.update({
      where: { appointment_id: appointmentId },
      data: {
        finished_at: new Date(),
        status: 'COMPLETED',
        updated_at: new Date(),
      },
    });
  }

  /** Cancel: transition to CANCELLED */
  async cancelAppointment(tenantId: string, appointmentId: bigint, reason?: string) {
    const apt = await this.findAppointmentById(tenantId, appointmentId);
    if (apt.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel a completed appointment');
    }
    return this.prisma.dock_appointments.update({
      where: { appointment_id: appointmentId },
      data: {
        status: 'CANCELLED',
        notes: reason || apt.notes,
        updated_at: new Date(),
      },
    });
  }

  // ─── YARD VEHICLES ──────────────────────────────────────────────────────

  async createVehicle(tenantId: string, dto: any) {
    return this.prisma.yard_vehicles.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        vehicle_type: dto.vehicleType || 'TRAILER',
        license_plate: dto.licensePlate || null,
        vin: dto.vin || null,
        description: dto.description || null,
        current_location_code: dto.currentLocationCode || null,
        status: 'IN_YARD',
        arrival_time: new Date(),
        notes: dto.notes || null,
        created_by: dto.createdBy || null,
      },
    });
  }

  async findAllVehicles(tenantId: string, query: any) {
    const { status, facilityId, page = 1, limit = 50 } = query;
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
    return { data, total, page, limit };
  }

  async findVehicleById(tenantId: string, vehicleId: bigint) {
    const v = await this.prisma.yard_vehicles.findFirst({
      where: { tenant_id: tenantId, vehicle_id: vehicleId },
    });
    if (!v) throw new NotFoundException('Vehicle not found');
    return v;
  }

  async updateVehicle(tenantId: string, vehicleId: bigint, dto: any) {
    await this.findVehicleById(tenantId, vehicleId);
    return this.prisma.yard_vehicles.update({
      where: { vehicle_id: vehicleId },
      data: { ...dto, updated_at: new Date() },
    });
  }

  /** Assign vehicle to a dock door */
  async assignVehicleToDock(tenantId: string, vehicleId: bigint, appointmentId: bigint) {
    const vehicle = await this.findVehicleById(tenantId, vehicleId);
    if (vehicle.status !== 'IN_YARD' && vehicle.status !== 'LOADING') {
      throw new BadRequestException(`Vehicle ${vehicle.status} cannot be assigned to dock`);
    }
    return this.prisma.yard_vehicles.update({
      where: { vehicle_id: vehicleId },
      data: {
        assigned_to_reference_type: 'APPOINTMENT',
        assigned_to_reference_id: appointmentId,
        status: 'LOADING',
        updated_at: new Date(),
      },
    });
  }

  /** Depart: mark vehicle as departed, free dock */
  async departVehicle(tenantId: string, vehicleId: bigint) {
    const vehicle = await this.findVehicleById(tenantId, vehicleId);
    if (vehicle.status !== 'LOADING') {
      throw new BadRequestException('Vehicle must be in LOADING status to depart');
    }
    return this.prisma.yard_vehicles.update({
      where: { vehicle_id: vehicleId },
      data: {
        status: 'DEPARTED',
        departure_time: new Date(),
        assigned_to_reference_type: null,
        assigned_to_reference_id: null,
        updated_at: new Date(),
      },
    });
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
    return this.prisma.dock_appointments.findMany({
      where: {
        tenant_id: tenantId,
        facility_id: facilityId,
        status: { in: ['REQUESTED', 'CONFIRMED'] },
        requested_time_slot_start: { gte: now },
      },
      orderBy: { requested_time_slot_start: 'asc' },
      take: 20,
    });
  }
}
