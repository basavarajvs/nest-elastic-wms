import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePackingStationDto, UpdatePackingStationDto } from './dtos/create-packing-station.dto';

@Injectable()
export class PackingStationsService {
  private readonly logger = new Logger(PackingStationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePackingStationDto, tenantId: string): Promise<any> {
    const existing = await (this.prisma as any).packingStation.findFirst({
      where: { tenantId, facilityId: dto.facilityId, stationCode: dto.stationCode },
    });
    if (existing) {
      throw new BadRequestException(`Station code "${dto.stationCode}" already exists`);
    }
    return (this.prisma as any).packingStation.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        stationCode: dto.stationCode,
        stationName: dto.stationName,
        description: dto.description,
        locationId: dto.locationId,
        printerType: dto.printerType,
        scaleType: dto.scaleType,
        scannerType: dto.scannerType,
        isActive: dto.isActive ?? true,
        isAvailable: dto.isAvailable ?? true,
      },
    });
  }

  async findAll(tenantId: string): Promise<any> {
    return (this.prisma as any).packingStation.findMany({
      where: { tenantId },
      orderBy: { stationCode: 'asc' },
    });
  }

  async findById(id: string, tenantId: string): Promise<any> {
    const station = await (this.prisma as any).packingStation.findFirst({
      where: { id, tenantId },
    });
    if (!station) throw new NotFoundException('Packing station not found');
    return station;
  }

  async update(id: string, dto: UpdatePackingStationDto, tenantId: string): Promise<any> {
    await this.findById(id, tenantId);
    return (this.prisma as any).packingStation.update({
      where: { id },
      data: {
        stationName: dto.stationName,
        description: dto.description,
        locationId: dto.locationId,
        printerType: dto.printerType,
        scaleType: dto.scaleType,
        scannerType: dto.scannerType,
        isActive: dto.isActive,
        isAvailable: dto.isAvailable,
      },
    });
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.findById(id, tenantId);
    await (this.prisma as any).packingStation.delete({ where: { id } });
  }
}
