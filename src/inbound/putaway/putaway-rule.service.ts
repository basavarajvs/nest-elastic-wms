import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PutawayRuleService {
  private readonly logger = new Logger(PutawayRuleService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const rule = await this.prisma.putaway_rules.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        rule_name: dto.rule_name,
        rule_code: dto.rule_code,
        description: dto.description,
        priority: dto.priority || 10,
        product_category_ids_json: dto.product_category_ids_json,
        product_attribute_rules_json: dto.product_attribute_rules_json,
        product_uom_ids_json: dto.product_uom_ids_json,
        destination_zone_ids_json: dto.destination_zone_ids_json,
        destination_location_types_json: dto.destination_location_types_json,
        destination_location_attributes_json: dto.destination_location_attributes_json,
        action_type: dto.action_type || 'FIND_BEST_FIT',
        fixed_location_code: dto.fixed_location_code,
        rotation_logic: dto.rotation_logic,
        is_active: dto.is_active ?? true,
        client_id: dto.client_id ? BigInt(dto.client_id) : undefined,
        product_id: dto.product_id ? BigInt(dto.product_id) : undefined,
        product_category_id: dto.product_category_id ? BigInt(dto.product_category_id) : undefined,
        destination_zone_id: dto.destination_zone_id ? BigInt(dto.destination_zone_id) : undefined,
        location_type_preference: dto.location_type_preference,
        velocity_class_filter: dto.velocity_class_filter || [],
        min_pick_frequency_per_day: dto.min_pick_frequency_per_day,
        prefer_pick_face_for_fast_movers: dto.prefer_pick_face_for_fast_movers,
        storage_condition_requirements_json: dto.storage_condition_requirements_json,
        is_overflow_rule: dto.is_overflow_rule ?? false,
        parent_rule_id: dto.parent_rule_id ? BigInt(dto.parent_rule_id) : undefined,
      },
    });
    return this.enrichRuleWithNames(rule);
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.isActive !== undefined) where.is_active = query.isActive;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.putaway_rules.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { priority: 'asc' },
      }),
      this.prisma.putaway_rules.count({ where }),
    ]);
    return { data: await this.enrichRulesWithNames(data), total, page, limit };
  }

  async delete(tenantId: string, ruleId: bigint) {
    return this.prisma.putaway_rules.deleteMany({
      where: { tenant_id: tenantId, rule_id: ruleId },
    });
  }

  async findById(tenantId: string, ruleId: bigint) {
    const rule = await this.prisma.putaway_rules.findFirst({
      where: { tenant_id: tenantId, rule_id: ruleId },
    });
    return this.enrichRuleWithNames(rule);
  }

  async update(tenantId: string, ruleId: bigint, dto: any) {
    await this.prisma.putaway_rules.updateMany({
      where: { tenant_id: tenantId, rule_id: ruleId },
      data: {
        rule_name: dto.rule_name,
        description: dto.description,
        priority: dto.priority,
        is_active: dto.is_active,
        action_type: dto.action_type,
        rotation_logic: dto.rotation_logic,
        fixed_location_code: dto.fixed_location_code,
        velocity_class_filter: dto.velocity_class_filter,
        min_pick_frequency_per_day: dto.min_pick_frequency_per_day,
        prefer_pick_face_for_fast_movers: dto.prefer_pick_face_for_fast_movers,
        location_type_preference: dto.location_type_preference,
        product_category_ids_json: dto.product_category_ids_json,
        product_attribute_rules_json: dto.product_attribute_rules_json,
        product_uom_ids_json: dto.product_uom_ids_json,
        storage_condition_requirements_json: dto.storage_condition_requirements_json,
        destination_zone_ids_json: dto.destination_zone_ids_json,
        destination_location_types_json: dto.destination_location_types_json,
        destination_location_attributes_json: dto.destination_location_attributes_json,
        is_overflow_rule: dto.is_overflow_rule,
        parent_rule_id: dto.parent_rule_id ? BigInt(dto.parent_rule_id) : undefined,
      },
    });
    return this.findById(tenantId, ruleId);
  }

  private async enrichRulesWithNames(rules: any[]): Promise<any[]> {
    if (!rules.length) return rules;
    const tenantId = rules[0].tenant_id;
    const facilityIds = [...new Set(rules.map(r => r.facility_id).filter(Boolean))];
    const clientIds = [...new Set(rules.map(r => r.client_id).filter(Boolean))];
    const productIds = [...new Set(rules.map(r => r.product_id).filter(Boolean))];
    const categoryIds = [...new Set(rules.map(r => r.product_category_id).filter(Boolean))];
    const zoneIds = [...new Set(rules.map(r => r.destination_zone_id).filter(Boolean))];
    const [facilities, clientRecs, products, categories, zones] = await Promise.all([
      facilityIds.length ? this.prisma.warehouse_facilities.findMany({ where: { tenant_id: tenantId, facility_id: { in: facilityIds } } }) : [],
      clientIds.length ? this.prisma.clients.findMany({ where: { tenant_id: tenantId, client_id: { in: clientIds } } }) : [],
      productIds.length ? this.prisma.products.findMany({ where: { tenant_id: tenantId, product_id: { in: productIds } } }) : [],
      categoryIds.length ? this.prisma.product_categories.findMany({ where: { tenant_id: tenantId, category_id: { in: categoryIds } } }) : [],
      zoneIds.length ? this.prisma.warehouse_zones.findMany({ where: { tenant_id: tenantId, zone_id: { in: zoneIds } } }) : [],
    ]) as [any[], any[], any[], any[], any[]];
    const facMap = new Map<string, string>();
    facilities.forEach(f => facMap.set(String(f.facility_id), f.facility_name));
    const clientMap = new Map<string, string>();
    clientRecs.forEach(c => clientMap.set(String(c.client_id), c.client_name));
    const prodMap = new Map<string, string>();
    products.forEach(p => prodMap.set(String(p.product_id), p.product_name));
    const catMap = new Map<string, string>();
    categories.forEach(c => catMap.set(String(c.category_id), c.category_name));
    const zoneMap = new Map<string, string>();
    zones.forEach(z => zoneMap.set(String(z.zone_id), z.zone_name));
    return rules.map(r => ({
      ...r,
      facility_name: facMap.get(String(r.facility_id)) ?? null,
      client_name: clientMap.get(String(r.client_id)) ?? null,
      product_name: prodMap.get(String(r.product_id)) ?? null,
      category_name: catMap.get(String(r.product_category_id)) ?? null,
      zone_name: zoneMap.get(String(r.destination_zone_id)) ?? null,
    }));
  }

  private async enrichRuleWithNames(rule: any): Promise<any> {
    if (!rule) return rule;
    const [rules] = await this.enrichRulesWithNames([rule]);
    return rules;
  }
}
