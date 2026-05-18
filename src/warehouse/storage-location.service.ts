import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto } from './dtos/create-location.dto';
import { UpdateLocationDto } from './dtos/update-location.dto';
import { LocationQueryDto } from './dtos/location-query.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

export enum Projection {
  WEB = 'WEB',
  RF = 'RF',
}

const LOCATION_CODE_REGEX =
  /^[A-Z0-9]{1,3}-[0-9]{2}-[A-Z0-9]{1,3}-[0-9]{2}-[0-9]{2}$/;

@Injectable()
export class StorageLocationService {
  private readonly logger = new Logger(StorageLocationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateLocationDto, tenantId: string) {
    if (!LOCATION_CODE_REGEX.test(dto.locationCode)) {
      throw new BadRequestException(
        `Invalid locationCode format. Expected format: ZONE-AISLE-BAY-LEVEL-LOC (e.g., A-01-B-02-03)`,
      );
    }

    const zone = await (this.prisma as any).warehouseZone.findFirst({
      where: { id: dto.zoneId, tenantId, facilityId: dto.facilityId },
    });
    if (!zone) {
      throw new NotFoundException('Zone not found in this facility/tenant');
    }

    const existing = await (this.prisma as any).storageLocation.findFirst({
      where: {
        tenantId,
        facilityId: dto.facilityId,
        locationCode: dto.locationCode,
      },
    });
    if (existing) {
      throw new BadRequestException(
        `Location code ${dto.locationCode} already exists in this facility`,
      );
    }

    const location = await (this.prisma as any).storageLocation.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        zoneId: dto.zoneId,
        locationCode: dto.locationCode,
        locationType: dto.locationType,
        attributes: dto.attributes || undefined,
      },
    });

    await (this.prisma as any).resourceQuota.updateMany({
      where: { tenantId, resourceType: 'locations' },
      data: { currentUsage: { increment: 1 } },
    });

    this.logger.log(`Location created: ${dto.locationCode} in tenant ${tenantId}`);
    return location;
  }

  async list(tenantId: string, query: LocationQueryDto, projection: Projection) {
    const where: Record<string, any> = { tenantId };
    if (query.facilityId) where.facilityId = query.facilityId;
    if (query.zoneId) where.zoneId = query.zoneId;
    if (query.locationCode) where.locationCode = query.locationCode;

    const locations = await (this.prisma as any).storageLocation.findMany({
      where,
      include:
        projection === Projection.WEB
          ? {
              zone: { select: { id: true, zoneCode: true, name: true } },
              _count: { select: { children: true } },
            }
          : undefined,
    });

    if (projection === Projection.RF) {
      return locations.map((l: any) => ({
        locationCode: l.locationCode,
        locationType: l.locationType,
        isActive: l.isActive,
        isBlocked: l.isBlocked,
        zoneCode: l.zone?.zoneCode || undefined,
      }));
    }

    return locations.map((l: any) => ({
      ...l,
      childrenCount: l._count?.children || 0,
    }));
  }

  async findByCode(
    tenantId: string,
    facilityId: string,
    code: string,
    projection: Projection = Projection.WEB,
  ) {
    const location = await (this.prisma as any).storageLocation.findFirst({
      where: { tenantId, facilityId, locationCode: code },
      include:
        projection === Projection.WEB
          ? {
              zone: { select: { id: true, zoneCode: true, name: true, zoneType: true } },
              children: { select: { id: true, locationCode: true, locationType: true } },
              parent: { select: { id: true, locationCode: true } },
            }
          : undefined,
    });

    if (!location) throw new NotFoundException('Location not found');

    if (projection === Projection.RF) {
      return {
        locationCode: location.locationCode,
        locationType: location.locationType,
        isActive: location.isActive,
        isBlocked: location.isBlocked,
        zoneCode: location.zone?.zoneCode || undefined,
      };
    }

    return location;
  }

  async getChildren(
    locationId: string,
    tenantId: string,
    depth = 0,
    maxDepth = 3,
  ): Promise<any[]> {
    if (depth >= maxDepth) return [];

    const location = await (this.prisma as any).storageLocation.findFirst({
      where: { id: locationId, tenantId },
    });
    if (!location) throw new NotFoundException('Location not found');

    const children = await (this.prisma as any).storageLocation.findMany({
      where: { parentId: locationId, tenantId },
    });

    const result: any[] = [];
    for (const child of children) {
      const grandChildren = await this.getChildren(
        child.id,
        tenantId,
        depth + 1,
        maxDepth,
      );
      result.push({ ...child, children: grandChildren });
    }
    return result;
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateLocationDto,
  ) {
    const location = await (this.prisma as any).storageLocation.findFirst({
      where: { id, tenantId },
    });
    if (!location) throw new NotFoundException('Location not found');

    return (this.prisma as any).storageLocation.update({
      where: { id },
      data: {
        isActive: dto.isActive,
        isBlocked: dto.isBlocked,
        attributes: dto.attributes,
        parentId: dto.parentId !== undefined ? dto.parentId : undefined,
      },
    });
  }
}
