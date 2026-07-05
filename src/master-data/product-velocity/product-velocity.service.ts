import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductVelocityService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const classification = this.classifyAbc(dto.pickFrequency || dto.averageDailyQuantity);
    return this.prisma.product_velocity_classification.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        product_id: BigInt(dto.productId),
        product_sku: dto.productSku,
        analysis_start_date: new Date(dto.analysisStartDate),
        analysis_end_date: new Date(dto.analysisEndDate),
        analysis_period_days: dto.analysisPeriodDays,
        total_orders: dto.totalOrders ?? 0,
        total_quantity_shipped: dto.totalQuantityShipped ?? 0,
        average_daily_quantity: dto.averageDailyQuantity,
        abc_class: classification,
        velocity_score: dto.velocityScore,
        velocity_rank: dto.velocityRank,
        movement_type: dto.movementType,
        pick_frequency: dto.pickFrequency,
        recommended_zone_type: dto.recommendedZoneType,
        recommended_location_type: dto.recommendedLocationType,
        next_calculation_due: dto.nextCalculationDue ? new Date(dto.nextCalculationDue) : undefined,
      },
      include: {
        products: { select: { product_code: true, product_name: true } },
        warehouse_facilities: { select: { facility_code: true, facility_name: true } },
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.productId) where.product_id = BigInt(query.productId);
    if (query.abcClass) where.abc_class = query.abcClass;
    if (query.movementType) where.movement_type = query.movementType;
    const page = query.page || 1;
    const limit = query.limit || 20;
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
    return { data, total, page, limit };
  }

  async findByProduct(tenantId: string, productId: bigint, facilityId?: bigint) {
    const where: any = { tenant_id: tenantId, product_id: productId };
    if (facilityId) where.facility_id = facilityId;
    return this.prisma.product_velocity_classification.findMany({
      where,
      orderBy: { calculated_at: 'desc' },
      include: {
        warehouse_facilities: { select: { facility_code: true, facility_name: true } },
      },
    });
  }

  async findById(tenantId: string, classificationId: bigint) {
    return this.prisma.product_velocity_classification.findFirst({
      where: { tenant_id: tenantId, classification_id: classificationId },
      include: {
        products: { select: { product_code: true, product_name: true } },
        warehouse_facilities: { select: { facility_code: true, facility_name: true } },
      },
    });
  }

  async delete(tenantId: string, classificationId: bigint) {
    return this.prisma.product_velocity_classification.deleteMany({
      where: { tenant_id: tenantId, classification_id: classificationId },
    });
  }

  async update(tenantId: string, classificationId: bigint, dto: any) {
    const data: any = {};
    if (dto.totalOrders !== undefined) data.total_orders = dto.totalOrders;
    if (dto.totalQuantityShipped !== undefined) data.total_quantity_shipped = dto.totalQuantityShipped;
    if (dto.averageDailyQuantity !== undefined) data.average_daily_quantity = dto.averageDailyQuantity;
    if (dto.pickFrequency !== undefined) {
      data.pick_frequency = dto.pickFrequency;
      data.abc_class = this.classifyAbc(dto.pickFrequency);
    }
    if (dto.velocityScore !== undefined) data.velocity_score = dto.velocityScore;
    if (dto.velocityRank !== undefined) data.velocity_rank = dto.velocityRank;
    if (dto.movementType !== undefined) data.movement_type = dto.movementType;
    if (dto.recommendedZoneType !== undefined) data.recommended_zone_type = dto.recommendedZoneType;
    if (dto.recommendedLocationType !== undefined) data.recommended_location_type = dto.recommendedLocationType;
    if (dto.nextCalculationDue !== undefined) data.next_calculation_due = new Date(dto.nextCalculationDue);
    return this.prisma.product_velocity_classification.updateMany({
      where: { tenant_id: tenantId, classification_id: classificationId },
      data,
    });
  }

  private classifyAbc(value: number): string {
    if (value >= 70) return 'A';
    if (value >= 20) return 'B';
    return 'C';
  }
}
