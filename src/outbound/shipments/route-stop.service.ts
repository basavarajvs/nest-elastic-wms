import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RouteStopService {
  private readonly logger = new Logger(RouteStopService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.route_stops.create({
      data: {
        tenant_id: tenantId,
        route_id: BigInt(dto.route_id),
        stop_sequence: dto.stop_sequence,
        location_name: dto.location_name,
        planned_arrival: dto.planned_arrival ? new Date(dto.planned_arrival) : undefined,
        planned_departure: dto.planned_departure ? new Date(dto.planned_departure) : undefined,
        carrier_id: dto.carrier_id ? BigInt(dto.carrier_id) : undefined,
        is_active: dto.is_active ?? true,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.route_id) where.route_id = BigInt(query.route_id);
    if (query.is_active !== undefined) where.is_active = query.is_active === 'true';
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.route_stops.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { stop_sequence: 'asc' },
      }),
      this.prisma.route_stops.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: bigint) {
    const row = await this.prisma.route_stops.findFirst({
      where: { tenant_id: tenantId, route_stop_id: id },
    });
    if (!row) throw new NotFoundException('Route stop not found');
    return row;
  }

  async update(tenantId: string, id: bigint, dto: any) {
    await this.findById(tenantId, id);
    const data: any = {};
    if (dto.stop_sequence !== undefined) data.stop_sequence = dto.stop_sequence;
    if (dto.location_name !== undefined) data.location_name = dto.location_name;
    if (dto.planned_arrival !== undefined) data.planned_arrival = dto.planned_arrival ? new Date(dto.planned_arrival) : null;
    if (dto.planned_departure !== undefined) data.planned_departure = dto.planned_departure ? new Date(dto.planned_departure) : null;
    if (dto.carrier_id !== undefined) data.carrier_id = dto.carrier_id ? BigInt(dto.carrier_id) : null;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (!Object.keys(data).length) throw new BadRequestException('No fields to update');
    return this.prisma.route_stops.update({
      where: { route_stop_id: id },
      data,
    });
  }

  async delete(tenantId: string, id: bigint) {
    const row = await this.findById(tenantId, id);
    await this.prisma.route_stops.deleteMany({
      where: { tenant_id: tenantId, route_stop_id: id },
    });
    return row;
  }
}
