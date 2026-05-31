import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLoadDto, UpdateLoadDto } from './dtos/create-load.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class LoadService {
  private readonly logger = new Logger(LoadService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateLoadDto, tenantId: string) {
    const existing = await (this.prisma as any).load.findFirst({
      where: { tenantId, facilityId: dto.facilityId, loadNumber: dto.loadNumber },
    });
    if (existing) throw new BadRequestException(`Load ${dto.loadNumber} already exists`);

    return (this.prisma as any).load.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        loadNumber: dto.loadNumber,
        carrierCode: dto.carrierCode || null,
        driverName: dto.driverName || null,
        driverPhone: dto.driverPhone || null,
        vehiclePlate: dto.vehiclePlate || null,
        dockDoorCode: dto.dockDoorCode || null,
        notes: dto.notes || null,
      },
    });
  }

  async findAll(tenantId: string, facilityId?: string, status?: string) {
    const where: Record<string, any> = { tenantId };
    if (facilityId) where.facilityId = facilityId;
    if (status) where.status = status;
    return (this.prisma as any).load.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string, tenantId: string) {
    const load = await (this.prisma as any).load.findFirst({ where: { id, tenantId } });
    if (!load) throw new NotFoundException('Load not found');
    return load;
  }

  async update(id: string, tenantId: string, dto: UpdateLoadDto) {
    const load = await (this.prisma as any).load.findFirst({ where: { id, tenantId } });
    if (!load) throw new NotFoundException('Load not found');

    const data: Record<string, any> = {};
    if (dto.status) data.status = dto.status;
    if (dto.carrierCode !== undefined) data.carrierCode = dto.carrierCode;
    if (dto.driverName !== undefined) data.driverName = dto.driverName;
    if (dto.driverPhone !== undefined) data.driverPhone = dto.driverPhone;
    if (dto.vehiclePlate !== undefined) data.vehiclePlate = dto.vehiclePlate;
    if (dto.dockDoorCode !== undefined) data.dockDoorCode = dto.dockDoorCode;
    if (dto.notes !== undefined) data.notes = dto.notes;

    if (dto.status === 'LOADED') data.departureTime = new Date();
    if (dto.status === 'IN_TRANSIT') data.departureTime = new Date();
    if (dto.status === 'ARRIVED') data.arrivalTime = new Date();
    if (dto.status === 'DELIVERED') data.arrivalTime = new Date();

    const updated = await (this.prisma as any).load.update({ where: { id }, data });

    if (dto.status) {
      this.eventEmitter.emit('load.status_changed', {
        loadId: id, loadNumber: load.loadNumber, from: load.status, to: dto.status, tenantId,
      });
    }
    return updated;
  }

  async findByLoadNumber(loadNumber: string, tenantId: string) {
    const load = await (this.prisma as any).load.findFirst({ where: { loadNumber, tenantId } });
    if (!load) throw new NotFoundException('Load not found');
    return load;
  }

  async markLoaded(id: string, tenantId: string) {
    const load = await (this.prisma as any).load.findFirst({ where: { id, tenantId } });
    if (!load) throw new BadRequestException('Load not found');
    if (!['PLANNED', 'READY', 'LOADING'].includes(load.status)) {
      throw new BadRequestException(`Cannot mark loaded from status ${load.status}`);
    }
    return (this.prisma as any).load.update({
      where: { id },
      data: { status: 'LOADED', departureTime: new Date() },
    });
  }

  async markDeparted(id: string, tenantId: string) {
    const load = await (this.prisma as any).load.findFirst({ where: { id, tenantId } });
    if (!load) throw new BadRequestException('Load not found');
    if (load.status !== 'LOADED') {
      throw new BadRequestException(`Cannot mark departed from status ${load.status}`);
    }
    return (this.prisma as any).load.update({
      where: { id },
      data: { status: 'IN_TRANSIT', departureTime: new Date() },
    });
  }

  async delete(id: string, tenantId: string) {
    const load = await (this.prisma as any).load.findFirst({ where: { id, tenantId } });
    if (!load) throw new NotFoundException('Load not found');
    await (this.prisma as any).load.delete({ where: { id } });
  }
}
