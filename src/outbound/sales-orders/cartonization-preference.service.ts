import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CartonizationPreferenceService {
  private readonly logger = new Logger(CartonizationPreferenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.customer_cartonization_preferences.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        customer_id: BigInt(dto.customer_id),
        preferred_carton_type: dto.preferred_carton_type,
        max_cartons_per_shipment: dto.max_cartons_per_shipment ?? 10,
        combine_items: dto.combine_items ?? true,
        signature_required_cartons: dto.signature_required_cartons ?? false,
        gift_wrap_cartons: dto.gift_wrap_cartons ?? false,
        is_active: dto.is_active ?? true,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facility_id) where.facility_id = BigInt(query.facility_id);
    if (query.customer_id) where.customer_id = BigInt(query.customer_id);
    if (query.is_active !== undefined) where.is_active = query.is_active === 'true';
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.customer_cartonization_preferences.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { customer_id: 'asc' },
      }),
      this.prisma.customer_cartonization_preferences.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: bigint) {
    const row = await this.prisma.customer_cartonization_preferences.findFirst({
      where: { tenant_id: tenantId, preference_id: id },
    });
    if (!row) throw new NotFoundException('Cartonization preference not found');
    return row;
  }

  async update(tenantId: string, id: bigint, dto: any) {
    await this.findById(tenantId, id);
    const data: any = {};
    if (dto.preferred_carton_type !== undefined) data.preferred_carton_type = dto.preferred_carton_type;
    if (dto.max_cartons_per_shipment !== undefined) data.max_cartons_per_shipment = dto.max_cartons_per_shipment;
    if (dto.combine_items !== undefined) data.combine_items = dto.combine_items;
    if (dto.signature_required_cartons !== undefined) data.signature_required_cartons = dto.signature_required_cartons;
    if (dto.gift_wrap_cartons !== undefined) data.gift_wrap_cartons = dto.gift_wrap_cartons;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (!Object.keys(data).length) throw new BadRequestException('No fields to update');
    return this.prisma.customer_cartonization_preferences.update({
      where: { preference_id: id },
      data,
    });
  }

  async delete(tenantId: string, id: bigint) {
    const row = await this.findById(tenantId, id);
    await this.prisma.customer_cartonization_preferences.deleteMany({
      where: { tenant_id: tenantId, preference_id: id },
    });
    return row;
  }
}
