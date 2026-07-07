import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExceptionEscalationService {
  private readonly logger = new Logger(ExceptionEscalationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const record = await this.prisma.exception_escalation_rules.create({
      data: {
        tenant_id: tenantId,
        facility_id: dto.facility_id ? BigInt(dto.facility_id) : undefined,
        rule_code: dto.rule_code,
        rule_name: dto.rule_name,
        description: dto.description,
        exception_type: dto.exception_type,
        exception_severity: dto.exception_severity,
        exception_category: dto.exception_category,
        escalation_level: dto.escalation_level ?? 1,
        time_threshold_minutes: dto.time_threshold_minutes,
        notify_roles: dto.notify_roles,
        notify_users: dto.notify_users,
        notification_method: dto.notification_method || 'EMAIL',
        notification_template: dto.notification_template,
        auto_assign_to_role: dto.auto_assign_to_role,
        auto_assign_to_user: dto.auto_assign_to_user,
        condition_expression: dto.condition_expression,
        is_active: dto.is_active ?? true,
        priority: dto.priority ?? 100,
        created_by: dto.created_by,
      },
    });
    return this.enrichRule(tenantId, record);
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.isActive !== undefined) where.is_active = query.isActive;
    if (query.exceptionType) where.exception_type = query.exceptionType;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.exception_escalation_rules.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { priority: 'asc' },
      }),
      this.prisma.exception_escalation_rules.count({ where }),
    ]);
    const enriched = await this.enrichRules(tenantId, data);
    return { data: enriched, total, page, limit };
  }

  async findById(tenantId: string, ruleId: bigint) {
    const record = await this.prisma.exception_escalation_rules.findFirst({
      where: { tenant_id: tenantId, rule_id: ruleId },
    });
    if (!record) return null;
    return this.enrichRule(tenantId, record);
  }

  async update(tenantId: string, ruleId: bigint, dto: any) {
    const data: any = {};
    if (dto.rule_name !== undefined) data.rule_name = dto.rule_name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.exception_severity !== undefined) data.exception_severity = dto.exception_severity;
    if (dto.exception_category !== undefined) data.exception_category = dto.exception_category;
    if (dto.escalation_level !== undefined) data.escalation_level = dto.escalation_level;
    if (dto.time_threshold_minutes !== undefined) data.time_threshold_minutes = dto.time_threshold_minutes;
    if (dto.notify_roles !== undefined) data.notify_roles = dto.notify_roles;
    if (dto.notify_users !== undefined) data.notify_users = dto.notify_users;
    if (dto.notification_method !== undefined) data.notification_method = dto.notification_method;
    if (dto.notification_template !== undefined) data.notification_template = dto.notification_template;
    if (dto.auto_assign_to_role !== undefined) data.auto_assign_to_role = dto.auto_assign_to_role;
    if (dto.auto_assign_to_user !== undefined) data.auto_assign_to_user = dto.auto_assign_to_user;
    if (dto.condition_expression !== undefined) data.condition_expression = dto.condition_expression;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (dto.priority !== undefined) data.priority = dto.priority;
    await this.prisma.exception_escalation_rules.updateMany({
      where: { tenant_id: tenantId, rule_id: ruleId },
      data,
    });
    return this.findById(tenantId, ruleId);
  }

  async evaluate(tenantId: string) {
    const activeRules = await this.prisma.exception_escalation_rules.findMany({
      where: { tenant_id: tenantId, is_active: true },
    });

    const results: any[] = [];
    for (const rule of activeRules) {
      const exceptionFilter: any = {
        tenant_id: tenantId,
        status: { in: ['OPEN', 'ACKNOWLEDGED'] },
        exception_type: rule.exception_type,
      };
      if (rule.exception_severity) exceptionFilter.exception_severity = rule.exception_severity;
      if (rule.facility_id) exceptionFilter.facility_id = rule.facility_id;

      const openExceptions = await this.prisma.exception_management.findMany({
        where: exceptionFilter,
      });

      for (const exc of openExceptions) {
        const elapsed = Date.now() - new Date(exc.reported_at).getTime();
        const elapsedMinutes = Math.floor(elapsed / 60000);

        if (elapsedMinutes >= rule.time_threshold_minutes) {
          results.push({
            ruleId: rule.rule_id,
            exceptionId: exc.exception_id,
            escalationLevel: rule.escalation_level,
            message: `Exception ${exc.exception_number} exceeded ${rule.time_threshold_minutes}m threshold`,
            severity: exc.exception_severity,
          });
          this.logger.warn(`Escalation triggered: ${exc.exception_number} - ${rule.rule_name}`);
        }
      }
    }
    return results;
  }

  async delete(tenantId: string, ruleId: bigint) {
    return this.prisma.exception_escalation_rules.deleteMany({
      where: { tenant_id: tenantId, rule_id: ruleId },
    });
  }

  private async enrichRule(tenantId: string, record: any) {
    const enriched = await this.enrichRules(tenantId, [record]);
    return enriched[0];
  }

  private async enrichRules(tenantId: string, records: any[]) {
    if (!records.length) return [];
    const facilityIds = [...new Set(records.filter(r => r.facility_id).map(r => r.facility_id))];
    const facilities = facilityIds.length
      ? await this.prisma.warehouse_facilities.findMany({
          where: { tenant_id: tenantId, facility_id: { in: facilityIds } },
          select: { facility_id: true, facility_name: true },
        })
      : [];
    const facMap = new Map<string, string | null>(
      facilities.map(f => [f.facility_id.toString(), f.facility_name] as [string, string | null]),
    );
    return records.map(record => ({
      ...record,
      facility_name: record.facility_id ? facMap.get(record.facility_id.toString()) ?? null : null,
    }));
  }
}
