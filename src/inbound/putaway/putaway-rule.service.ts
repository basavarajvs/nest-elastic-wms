import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PutawayRuleService {
  private readonly logger = new Logger(PutawayRuleService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.putaway_rules.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        rule_name: dto.ruleName,
        rule_code: dto.ruleCode,
        description: dto.description,
        priority: dto.priority || 10,
        product_category_ids_json: dto.productCategoryIdsJson,
        destination_zone_ids_json: dto.destinationZoneIdsJson,
        destination_location_types_json: dto.destinationLocationTypesJson,
        action_type: dto.actionType || 'FIND_BEST_FIT',
        fixed_location_code: dto.fixedLocationCode,
        rotation_logic: dto.rotationLogic,
        is_active: dto.isActive ?? true,
        client_id: dto.clientId ? BigInt(dto.clientId) : undefined,
        product_id: dto.productId ? BigInt(dto.productId) : undefined,
        product_category_id: dto.productCategoryId ? BigInt(dto.productCategoryId) : undefined,
        destination_zone_id: dto.destinationZoneId ? BigInt(dto.destinationZoneId) : undefined,
        location_type_preference: dto.locationTypePreference,
        velocity_class_filter: dto.velocityClassFilter || [],
        min_pick_frequency_per_day: dto.minPickFrequencyPerDay,
        prefer_pick_face_for_fast_movers: dto.preferPickFaceForFastMovers,
        storage_condition_requirements_json: dto.storageConditionRequirementsJson,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.isActive !== undefined) where.is_active = query.isActive;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.putaway_rules.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { priority: 'asc' },
      }),
      this.prisma.putaway_rules.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async delete(tenantId: string, ruleId: bigint) {
    return this.prisma.putaway_rules.deleteMany({
      where: { tenant_id: tenantId, rule_id: ruleId },
    });
  }

  async findById(tenantId: string, ruleId: bigint) {
    return this.prisma.putaway_rules.findFirst({
      where: { tenant_id: tenantId, rule_id: ruleId },
    });
  }

  async update(tenantId: string, ruleId: bigint, dto: any) {
    return this.prisma.putaway_rules.updateMany({
      where: { tenant_id: tenantId, rule_id: ruleId },
      data: {
        rule_name: dto.ruleName,
        description: dto.description,
        priority: dto.priority,
        is_active: dto.isActive,
        action_type: dto.actionType,
        rotation_logic: dto.rotationLogic,
        fixed_location_code: dto.fixedLocationCode,
        velocity_class_filter: dto.velocityClassFilter,
        prefer_pick_face_for_fast_movers: dto.preferPickFaceForFastMovers,
      },
    });
  }
}
