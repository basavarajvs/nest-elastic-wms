import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFacilityDto } from './dtos/create-facility.dto';
import { UpdateFacilityDto } from './dtos/update-facility.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class WarehouseFacilityService {
  private readonly logger = new Logger(WarehouseFacilityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateFacilityDto, tenantId: string) {
    const existing = await (this.prisma as any).warehouseFacility.findFirst({
      where: { tenantId, facilityCode: dto.facilityCode },
    });
    if (existing) {
      throw new BadRequestException(`Facility code ${dto.facilityCode} already exists`);
    }

    const facility = await (this.prisma as any).warehouseFacility.create({
      data: {
        tenantId,
        facilityCode: dto.facilityCode,
        name: dto.name,
        facilityType: dto.facilityType || 'WAREHOUSE',
        isActive: dto.isActive ?? true,
        attributes: dto.attributes || undefined,
      },
    });

    this.logger.log(`Facility created: ${dto.facilityCode} (${dto.name})`);
    this.eventEmitter.emit('facility.created', {
      facilityId: facility.id,
      facilityCode: facility.facilityCode,
      tenantId,
    });

    return facility;
  }

  async findById(id: string, tenantId: string) {
    const facility = await (this.prisma as any).warehouseFacility.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { zones: true } } },
    });
    if (!facility) throw new NotFoundException('Facility not found');
    return facility;
  }

  async findAll(tenantId: string) {
    return (this.prisma as any).warehouseFacility.findMany({
      where: { tenantId },
      include: { _count: { select: { zones: true } } },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateFacilityDto) {
    const facility = await (this.prisma as any).warehouseFacility.findFirst({
      where: { id, tenantId },
    });
    if (!facility) throw new NotFoundException('Facility not found');

    if (dto.facilityCode && dto.facilityCode !== facility.facilityCode) {
      const existing = await (this.prisma as any).warehouseFacility.findFirst({
        where: { tenantId, facilityCode: dto.facilityCode, id: { not: id } },
      });
      if (existing) {
        throw new BadRequestException(`Facility code ${dto.facilityCode} already in use`);
      }
    }

    const updated = await (this.prisma as any).warehouseFacility.update({
      where: { id },
      data: {
        facilityCode: dto.facilityCode,
        name: dto.name,
        facilityType: dto.facilityType,
        isActive: dto.isActive,
        attributes: dto.attributes,
      },
    });

    this.logger.log(`Facility updated: ${updated.facilityCode}`);
    this.eventEmitter.emit('facility.updated', {
      facilityId: updated.id,
      facilityCode: updated.facilityCode,
      tenantId,
    });

    return updated;
  }

  async delete(id: string, tenantId: string) {
    const facility = await (this.prisma as any).warehouseFacility.findFirst({
      where: { id, tenantId },
    });
    if (!facility) throw new NotFoundException('Facility not found');

    const zonesCount = await (this.prisma as any).warehouseZone.count({
      where: { facilityId: id },
    });
    if (zonesCount > 0) {
      throw new BadRequestException(
        `Cannot delete facility with ${zonesCount} zone(s). Remove zones first.`,
      );
    }

    await (this.prisma as any).warehouseFacility.delete({ where: { id } });

    this.logger.log(`Facility deleted: ${facility.facilityCode}`);
    this.eventEmitter.emit('facility.deleted', {
      facilityId: id,
      facilityCode: facility.facilityCode,
      tenantId,
    });
  }
}
