import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ShippingRouteService {
  private readonly logger = new Logger(ShippingRouteService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.shipping_routes.create({
      data: {
        tenant_id: tenantId,
        route_code: dto.route_code,
        description: dto.description,
        origin_facility_id: dto.origin_facility_id ? BigInt(dto.origin_facility_id) : undefined,
        is_active: dto.is_active ?? true,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.is_active !== undefined) where.is_active = query.is_active === 'true';
    if (query.search) {
      where.OR = [
        { route_code: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.shipping_routes.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { route_code: 'asc' },
      }),
      this.prisma.shipping_routes.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: bigint) {
    const row = await this.prisma.shipping_routes.findFirst({
      where: { tenant_id: tenantId, route_id: id },
    });
    if (!row) throw new NotFoundException('Shipping route not found');
    return row;
  }

  async update(tenantId: string, id: bigint, dto: any) {
    await this.findById(tenantId, id);
    const data: any = {};
    if (dto.route_code !== undefined) data.route_code = dto.route_code;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.origin_facility_id !== undefined) data.origin_facility_id = dto.origin_facility_id ? BigInt(dto.origin_facility_id) : null;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (!Object.keys(data).length) throw new BadRequestException('No fields to update');
    return this.prisma.shipping_routes.update({
      where: { route_id: id },
      data,
    });
  }

  async delete(tenantId: string, id: bigint) {
    const row = await this.findById(tenantId, id);
    await this.prisma.shipping_routes.deleteMany({
      where: { tenant_id: tenantId, route_id: id },
    });
    return row;
  }
}
