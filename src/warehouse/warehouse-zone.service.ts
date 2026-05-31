import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateZoneDto } from './dtos/create-zone.dto';
import { UpdateZoneDto } from './dtos/update-zone.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class WarehouseZoneService {
  private readonly logger = new Logger(WarehouseZoneService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateZoneDto, tenantId: string) {
    const facility = await (this.prisma as any).warehouseFacility.findFirst({
      where: { id: dto.facilityId, tenantId },
    });
    if (!facility) throw new NotFoundException('Facility not found in this tenant');

    const existing = await (this.prisma as any).warehouseZone.findFirst({
      where: { tenantId, facilityId: dto.facilityId, zoneCode: dto.zoneCode },
    });
    if (existing) {
      throw new BadRequestException(`Zone code ${dto.zoneCode} already exists in this facility`);
    }

    const zone = await (this.prisma as any).warehouseZone.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        zoneCode: dto.zoneCode,
        name: dto.name,
        zoneType: dto.zoneType || 'BULK',
        isActive: dto.isActive ?? true,
        attributes: dto.attributes || undefined,
      },
    });

    this.logger.log(`Zone created: ${dto.zoneCode} in facility ${dto.facilityId}`);
    return zone;
  }

  async findById(id: string, tenantId: string) {
    const zone = await (this.prisma as any).warehouseZone.findFirst({
      where: { id, tenantId },
      include: {
        facility: { select: { id: true, facilityCode: true, name: true } },
        _count: { select: { locations: true } },
      },
    });
    if (!zone) throw new NotFoundException('Zone not found');
    return zone;
  }

  async findAll(tenantId: string, facilityId?: string) {
    const where: Record<string, any> = { tenantId };
    if (facilityId) where.facilityId = facilityId;
    return (this.prisma as any).warehouseZone.findMany({
      where,
      include: {
        facility: { select: { id: true, facilityCode: true, name: true } },
        _count: { select: { locations: true } },
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateZoneDto) {
    const zone = await (this.prisma as any).warehouseZone.findFirst({
      where: { id, tenantId },
    });
    if (!zone) throw new NotFoundException('Zone not found');

    if (dto.zoneCode && dto.zoneCode !== zone.zoneCode) {
      const facilityId = dto.facilityId || zone.facilityId;
      const existing = await (this.prisma as any).warehouseZone.findFirst({
        where: { tenantId, facilityId, zoneCode: dto.zoneCode, id: { not: id } },
      });
      if (existing) {
        throw new BadRequestException(`Zone code ${dto.zoneCode} already exists in this facility`);
      }
    }

    const updated = await (this.prisma as any).warehouseZone.update({
      where: { id },
      data: {
        facilityId: dto.facilityId,
        zoneCode: dto.zoneCode,
        name: dto.name,
        zoneType: dto.zoneType,
        isActive: dto.isActive,
        attributes: dto.attributes,
      },
    });

    this.logger.log(`Zone updated: ${updated.zoneCode}`);
    return updated;
  }

  async delete(id: string, tenantId: string) {
    const zone = await (this.prisma as any).warehouseZone.findFirst({
      where: { id, tenantId },
    });
    if (!zone) throw new NotFoundException('Zone not found');

    const locationsCount = await (this.prisma as any).storageLocation.count({
      where: { zoneId: id },
    });
    if (locationsCount > 0) {
      throw new BadRequestException(
        `Cannot delete zone with ${locationsCount} location(s). Remove locations first.`,
      );
    }

    await (this.prisma as any).warehouseZone.delete({ where: { id } });
    this.logger.log(`Zone deleted: ${zone.zoneCode}`);
  }
}
