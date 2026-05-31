import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateLoadingDockDto, UpdateLoadingDockDto } from './dtos/create-loading-dock.dto';

@Injectable()
export class LoadingDocksService {
  private readonly logger = new Logger(LoadingDocksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateLoadingDockDto, tenantId: string): Promise<any> {
    const existing = await (this.prisma as any).loadingDock.findFirst({
      where: { tenantId, facilityId: dto.facilityId, dockCode: dto.dockCode },
    });
    if (existing) throw new BadRequestException(`Dock code "${dto.dockCode}" already exists`);

    const dock = await (this.prisma as any).loadingDock.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        dockCode: dto.dockCode,
        dockName: dto.dockName,
        dockType: dto.dockType ?? 'BOTH',
        description: dto.description,
        locationId: dto.locationId,
        maxTrailerLength: dto.maxTrailerLength,
        maxTrailerHeight: dto.maxTrailerHeight,
        hasLeveler: dto.hasLeveler,
        hasSealant: dto.hasSealant,
        isActive: dto.isActive ?? true,
        isAvailable: dto.isAvailable ?? true,
      },
    });

    this.eventEmitter.emit('loading_dock.created', { dockId: dock.id, tenantId });
    return dock;
  }

  async findAll(tenantId: string, facilityId?: string): Promise<any> {
    const where: any = { tenantId };
    if (facilityId) where.facilityId = facilityId;
    return (this.prisma as any).loadingDock.findMany({
      where,
      orderBy: { dockCode: 'asc' },
    });
  }

  async findById(id: string, tenantId: string): Promise<any> {
    const dock = await (this.prisma as any).loadingDock.findFirst({ where: { id, tenantId } });
    if (!dock) throw new NotFoundException('Loading dock not found');
    return dock;
  }

  async update(id: string, dto: UpdateLoadingDockDto, tenantId: string): Promise<any> {
    await this.findById(id, tenantId);
    return (this.prisma as any).loadingDock.update({
      where: { id },
      data: {
        dockName: dto.dockName,
        description: dto.description,
        locationId: dto.locationId,
        maxTrailerLength: dto.maxTrailerLength,
        maxTrailerHeight: dto.maxTrailerHeight,
        hasLeveler: dto.hasLeveler,
        hasSealant: dto.hasSealant,
        isActive: dto.isActive,
        isAvailable: dto.isAvailable,
      },
    });
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.findById(id, tenantId);
    await (this.prisma as any).loadingDock.delete({ where: { id } });
  }
}
