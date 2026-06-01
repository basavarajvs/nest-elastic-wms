import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFacilityDto } from './dtos/create-facility.dto';
import { UpdateFacilityDto } from './dtos/update-facility.dto';
import { GenerateLocationsDto } from './dtos/generate-locations.dto';
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

  async generateLocations(facilityId: string, dto: GenerateLocationsDto, tenantId: string): Promise<any> {
    const facility = await (this.prisma as any).warehouseFacility.findFirst({
      where: { id: facilityId, tenantId },
    });
    if (!facility) throw new NotFoundException('Facility not found');

    const results: any[] = [];

    for (const zoneCfg of dto.zones) {
      let zone = await (this.prisma as any).warehouseZone.findFirst({
        where: { tenantId, facilityId, zoneCode: zoneCfg.code },
      });

      if (!zone) {
        zone = await (this.prisma as any).warehouseZone.create({
          data: { tenantId, facilityId, zoneCode: zoneCfg.code, name: zoneCfg.name, zoneType: 'BULK' },
        });
      }

      for (const aisleCfg of zoneCfg.aisles) {
        let aisle = await (this.prisma as any).aisle.findFirst({
          where: { tenantId, facilityId, zoneId: zone.id, aisleCode: aisleCfg.code },
        });
        if (!aisle) {
          aisle = await (this.prisma as any).aisle.create({
            data: { tenantId, facilityId, zoneId: zone.id, aisleCode: aisleCfg.code },
          });
        }
        results.push({ type: 'aisle', id: aisle.id, code: aisleCfg.code });

        for (const bayCfg of aisleCfg.bays) {
          let bay = await (this.prisma as any).bay.findFirst({
            where: { tenantId, facilityId, zoneId: zone.id, aisleId: aisle.id, bayCode: bayCfg.code },
          });
          if (!bay) {
            bay = await (this.prisma as any).bay.create({
              data: { tenantId, facilityId, zoneId: zone.id, aisleId: aisle.id, bayCode: bayCfg.code },
            });
          }
          results.push({ type: 'bay', id: bay.id, code: bayCfg.code });

          let rack = await (this.prisma as any).rack.findFirst({
            where: { tenantId, facilityId, zoneId: zone.id, aisleId: aisle.id, bayId: bay.id, rackCode: 'R01' },
          });
          if (!rack) {
            rack = await (this.prisma as any).rack.create({
              data: { tenantId, facilityId, zoneId: zone.id, aisleId: aisle.id, bayId: bay.id, rackCode: 'R01' },
            });
          }
          results.push({ type: 'rack', id: rack.id, code: 'R01' });

          for (const levelCfg of bayCfg.levels) {
            let level = await (this.prisma as any).level.findFirst({
              where: { tenantId, facilityId, zoneId: zone.id, aisleId: aisle.id, bayId: bay.id, rackId: rack.id, levelCode: levelCfg.code },
            });
            if (!level) {
              level = await (this.prisma as any).level.create({
                data: { tenantId, facilityId, zoneId: zone.id, aisleId: aisle.id, bayId: bay.id, rackId: rack.id, levelCode: levelCfg.code },
              });
            }
            if (levelCfg.locationsPerLevel > 0) {
              for (let i = 1; i <= levelCfg.locationsPerLevel; i++) {
                const locCode = levelCfg.locationPrefix
                  ? `${levelCfg.locationPrefix}-${String(i).padStart(2, '0')}`
                  : `${aisleCfg.code}-${bayCfg.code}-${levelCfg.code}-${String(i).padStart(2, '0')}`;
                const existingLoc = await (this.prisma as any).storageLocation.findFirst({
                  where: { tenantId, facilityId, locationCode: locCode },
                });
                if (!existingLoc) {
                  const loc = await (this.prisma as any).storageLocation.create({
                    data: {
                      tenantId, facilityId, zoneId: zone.id,
                      locationCode: locCode,
                      locationType: 'PALLET',
                    },
                  });
                  results.push({ type: 'location', id: loc.id, code: locCode });
                }
              }
            }
          }
        }
      }
    }

    this.eventEmitter.emit('facility.locations.generated', {
      facilityId, tenantId, totalCreated: results.length,
    });

    return { created: results.length, details: results };
  }
}
