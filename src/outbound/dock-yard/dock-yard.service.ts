import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAppointmentDto, RegisterVehicleDto, ListAppointmentsDto } from './dtos/dock-yard.dto';

@Injectable()
export class DockYardService {
  private readonly logger = new Logger(DockYardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createAppointment(dto: CreateAppointmentDto, tenantId: string): Promise<any> {
    return this.prisma.dockAppointment.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        dockId: dto.dockId,
        appointmentNumber: dto.appointmentNumber,
        appointmentType: dto.appointmentType,
        carrierName: dto.carrierName ?? undefined,
        carrierCode: dto.carrierCode ?? undefined,
        driverName: dto.driverName ?? undefined,
        driverPhone: dto.driverPhone ?? undefined,
        vehiclePlate: dto.vehiclePlate ?? undefined,
        trailerId: dto.trailerId ?? undefined,
        referenceType: dto.referenceType ?? undefined,
        referenceNumber: dto.referenceNumber ?? undefined,
        scheduledStart: new Date(dto.scheduledStart),
        scheduledEnd: new Date(dto.scheduledEnd),
        notes: dto.notes ?? undefined,
      },
    });
  }

  async listAppointments(tenantId: string, filters: ListAppointmentsDto): Promise<any> {
    const where: any = { tenantId, facilityId: filters.facilityId };
    if (filters.dockId) where.dockId = filters.dockId;
    if (filters.status) where.status = filters.status;
    if (filters.date) {
      const d = new Date(filters.date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.scheduledStart = { gte: d, lt: next };
    }
    return this.prisma.dockAppointment.findMany({
      where,
      orderBy: { scheduledStart: 'asc' },
    });
  }

  async checkIn(id: string, tenantId: string): Promise<any> {
    const apt = await this.findAppointment(id, tenantId);
    if (apt.status !== 'SCHEDULED') throw new BadRequestException(`Cannot check-in appointment with status ${apt.status}`);
    return this.prisma.dockAppointment.update({
      where: { id },
      data: { status: 'CHECKED_IN', actualArrival: new Date() },
    });
  }

  async complete(id: string, tenantId: string): Promise<any> {
    const apt = await this.findAppointment(id, tenantId);
    if (apt.status === 'COMPLETED' || apt.status === 'CANCELLED') {
      throw new BadRequestException(`Cannot complete appointment with status ${apt.status}`);
    }
    return this.prisma.dockAppointment.update({
      where: { id },
      data: { status: 'COMPLETED', actualDeparture: new Date() },
    });
  }

  async cancel(id: string, tenantId: string): Promise<any> {
    await this.findAppointment(id, tenantId);
    return this.prisma.dockAppointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async registerVehicle(dto: RegisterVehicleDto, tenantId: string): Promise<any> {
    return this.prisma.yardVehicle.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        vehicleType: dto.vehicleType,
        vehiclePlate: dto.vehiclePlate,
        carrierCode: dto.carrierCode ?? undefined,
        driverName: dto.driverName ?? undefined,
        driverPhone: dto.driverPhone ?? undefined,
        sealNumber: dto.sealNumber ?? undefined,
        yardLocation: dto.yardLocation ?? undefined,
        arrivedAt: new Date(),
      },
    });
  }

  async listVehicles(tenantId: string, filters: { facilityId: string; status?: string }): Promise<any> {
    const where: any = { tenantId, facilityId: filters.facilityId };
    if (filters.status) where.status = filters.status;
    return this.prisma.yardVehicle.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async assignDock(id: string, dockId: string, tenantId: string): Promise<any> {
    const vehicle = await this.findVehicle(id, tenantId);
    if (vehicle.status === 'DEPARTED') throw new BadRequestException('Cannot assign dock to departed vehicle');
    return this.prisma.yardVehicle.update({
      where: { id },
      data: {
        status: 'AT_DOCK',
        yardLocation: dockId,
        dockAssignedAt: new Date(),
      },
    });
  }

  async departVehicle(id: string, tenantId: string): Promise<any> {
    await this.findVehicle(id, tenantId);
    return this.prisma.yardVehicle.update({
      where: { id },
      data: { status: 'DEPARTED', departedAt: new Date() },
    });
  }

  async getUpcoming(tenantId: string, facilityId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.dockAppointment.findMany({
      where: {
        tenantId,
        facilityId,
        status: { in: ['SCHEDULED', 'CHECKED_IN', 'LOADING'] },
        scheduledStart: { gte: today, lt: tomorrow },
      },
      orderBy: { scheduledStart: 'asc' },
    });
  }

  private async findAppointment(id: string, tenantId: string): Promise<any> {
    const apt = await this.prisma.dockAppointment.findFirst({ where: { id, tenantId } });
    if (!apt) throw new NotFoundException('Dock appointment not found');
    return apt;
  }

  private async findVehicle(id: string, tenantId: string): Promise<any> {
    const v = await this.prisma.yardVehicle.findFirst({ where: { id, tenantId } });
    if (!v) throw new NotFoundException('Yard vehicle not found');
    return v;
  }
}
