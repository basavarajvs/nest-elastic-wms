import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductVelocityService {
  constructor(private readonly prisma: PrismaService) {}

  private flatten(record: any) {
    if (!record) return null;
    return {
      ...record,
      product_name: record.products?.product_name,
      facility_name: record.warehouse_facilities?.facility_name,
      products: undefined,
      warehouse_facilities: undefined,
    };
  }

  async create(tenantId: string, dto: any) {
    const record = await this.prisma.product_velocity_classification.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        product_id: BigInt(dto.product_id),
        product_sku: dto.product_sku,
        analysis_start_date: new Date(dto.analysis_start_date),
        analysis_end_date: new Date(dto.analysis_end_date),
        analysis_period_days: dto.analysis_period_days,
        total_orders: dto.total_orders ?? 0,
        total_quantity_shipped: dto.total_quantity_shipped ?? 0,
        average_daily_quantity: dto.average_daily_quantity,
        abc_class: dto.abc_class || this.classifyAbc(dto.pick_frequency || dto.average_daily_quantity),
        velocity_score: dto.velocity_score,
        velocity_rank: dto.velocity_rank,
        movement_type: dto.movement_type,
        pick_frequency: dto.pick_frequency,
        recommended_zone_type: dto.recommended_zone_type,
        recommended_location_type: dto.recommended_location_type,
        next_calculation_due: dto.next_calculation_due ? new Date(dto.next_calculation_due) : undefined,
      },
      include: {
        products: { select: { product_code: true, product_name: true } },
        warehouse_facilities: { select: { facility_code: true, facility_name: true } },
      },
    });
    return this.flatten(record);
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.productId) where.product_id = BigInt(query.productId);
    if (query.abcClass) where.abc_class = query.abcClass;
    if (query.movementType) where.movement_type = query.movementType;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.product_velocity_classification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { velocity_rank: { sort: 'asc', nulls: 'last' } },
        include: {
          products: { select: { product_code: true, product_name: true } },
          warehouse_facilities: { select: { facility_code: true, facility_name: true } },
        },
      }),
      this.prisma.product_velocity_classification.count({ where }),
    ]);
    return { data: data.map((r) => this.flatten(r)), total, page, limit };
  }

  async findByProduct(tenantId: string, productId: bigint, facilityId?: bigint) {
    const where: any = { tenant_id: tenantId, product_id: productId };
    if (facilityId) where.facility_id = facilityId;
    const records = await this.prisma.product_velocity_classification.findMany({
      where,
      orderBy: { calculated_at: 'desc' },
      include: {
        products: { select: { product_name: true } },
        warehouse_facilities: { select: { facility_name: true } },
      },
    });
    return records.map((r) => this.flatten(r));
  }

  async findById(tenantId: string, classificationId: bigint) {
    const record = await this.prisma.product_velocity_classification.findFirst({
      where: { tenant_id: tenantId, classification_id: classificationId },
      include: {
        products: { select: { product_code: true, product_name: true } },
        warehouse_facilities: { select: { facility_code: true, facility_name: true } },
      },
    });
    return this.flatten(record);
  }

  async delete(tenantId: string, classificationId: bigint) {
    const record = await this.findById(tenantId, classificationId);
    await this.prisma.product_velocity_classification.deleteMany({
      where: { tenant_id: tenantId, classification_id: classificationId },
    });
    return record;
  }

  async update(tenantId: string, classificationId: bigint, dto: any) {
    const data: any = {};
    if (dto.total_orders !== undefined) data.total_orders = dto.total_orders;
    if (dto.total_quantity_shipped !== undefined) data.total_quantity_shipped = dto.total_quantity_shipped;
    if (dto.average_daily_quantity !== undefined) data.average_daily_quantity = dto.average_daily_quantity;
    if (dto.abc_class !== undefined) data.abc_class = dto.abc_class;
    if (dto.pick_frequency !== undefined) {
      data.pick_frequency = dto.pick_frequency;
      if (dto.abc_class === undefined) data.abc_class = this.classifyAbc(dto.pick_frequency);
    }
    if (dto.velocity_score !== undefined) data.velocity_score = dto.velocity_score;
    if (dto.velocity_rank !== undefined) data.velocity_rank = dto.velocity_rank;
    if (dto.movement_type !== undefined) data.movement_type = dto.movement_type;
    if (dto.recommended_zone_type !== undefined) data.recommended_zone_type = dto.recommended_zone_type;
    if (dto.recommended_location_type !== undefined) data.recommended_location_type = dto.recommended_location_type;
    if (dto.next_calculation_due !== undefined) data.next_calculation_due = new Date(dto.next_calculation_due);
    await this.prisma.product_velocity_classification.updateMany({
      where: { tenant_id: tenantId, classification_id: classificationId },
      data,
    });
    return this.findById(tenantId, classificationId);
  }

  private classifyAbc(value: number): string {
    if (value >= 70) return 'A';
    if (value >= 20) return 'B';
    return 'C';
  }
}
