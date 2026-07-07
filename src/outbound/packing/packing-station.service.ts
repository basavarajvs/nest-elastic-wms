import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PackingStationService {
  private readonly logger = new Logger(PackingStationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.packing_stations.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        station_name: dto.station_name,
        station_code: dto.station_code,
        description: dto.description,
        location_id: dto.location_id ? BigInt(dto.location_id) : undefined,
        printer_type: dto.printer_type,
        scale_type: dto.scale_type,
        scanner_type: dto.scanner_type,
        scale_device_id: dto.scale_device_id,
        scale_device_type: dto.scale_device_type,
        is_active: dto.is_active ?? true,
        is_available: dto.is_available ?? true,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facility_id) where.facility_id = BigInt(query.facility_id);
    if (query.is_active !== undefined) where.is_active = query.is_active === 'true';
    if (query.is_available !== undefined) where.is_available = query.is_available === 'true';
    if (query.search) {
      where.OR = [
        { station_name: { contains: query.search, mode: 'insensitive' } },
        { station_code: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.packing_stations.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { station_name: 'asc' },
      }),
      this.prisma.packing_stations.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: bigint) {
    const row = await this.prisma.packing_stations.findFirst({
      where: { tenant_id: tenantId, station_id: id },
    });
    if (!row) throw new NotFoundException('Packing station not found');
    return row;
  }

  async update(tenantId: string, id: bigint, dto: any) {
    await this.findById(tenantId, id);
    const data: any = {};
    if (dto.station_name !== undefined) data.station_name = dto.station_name;
    if (dto.station_code !== undefined) data.station_code = dto.station_code;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.location_id !== undefined) data.location_id = dto.location_id ? BigInt(dto.location_id) : null;
    if (dto.printer_type !== undefined) data.printer_type = dto.printer_type;
    if (dto.scale_type !== undefined) data.scale_type = dto.scale_type;
    if (dto.scanner_type !== undefined) data.scanner_type = dto.scanner_type;
    if (dto.scale_device_id !== undefined) data.scale_device_id = dto.scale_device_id;
    if (dto.scale_device_type !== undefined) data.scale_device_type = dto.scale_device_type;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (dto.is_available !== undefined) data.is_available = dto.is_available;
    if (!Object.keys(data).length) throw new BadRequestException('No fields to update');
    return this.prisma.packing_stations.update({
      where: { station_id: id },
      data,
    });
  }

  async delete(tenantId: string, id: bigint) {
    const row = await this.findById(tenantId, id);
    await this.prisma.packing_stations.deleteMany({
      where: { tenant_id: tenantId, station_id: id },
    });
    return row;
  }
}
