import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExceptionEscalationService {
  private readonly logger = new Logger(ExceptionEscalationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.exception_escalation_rules.create({
      data: {
        tenant_id: tenantId,
        facility_id: dto.facilityId ? BigInt(dto.facilityId) : undefined,
        rule_code: dto.ruleCode,
        rule_name: dto.ruleName,
        description: dto.description,
        exception_type: dto.exceptionType,
        exception_severity: dto.exceptionSeverity,
        exception_category: dto.exceptionCategory,
        escalation_level: dto.escalationLevel ?? 1,
        time_threshold_minutes: dto.timeThresholdMinutes,
        notify_roles: dto.notifyRoles,
        notify_users: dto.notifyUsers,
        notification_method: dto.notificationMethod || 'EMAIL',
        notification_template: dto.notificationTemplate,
        auto_assign_to_role: dto.autoAssignToRole,
        auto_assign_to_user: dto.autoAssignToUser,
        condition_expression: dto.conditionExpression,
        is_active: dto.isActive ?? true,
        priority: dto.priority ?? 100,
        created_by: dto.createdBy,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.isActive !== undefined) where.is_active = query.isActive;
    if (query.exceptionType) where.exception_type = query.exceptionType;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.exception_escalation_rules.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { priority: 'asc' },
      }),
      this.prisma.exception_escalation_rules.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, ruleId: bigint) {
    return this.prisma.exception_escalation_rules.findFirst({
      where: { tenant_id: tenantId, rule_id: ruleId },
    });
  }

  async update(tenantId: string, ruleId: bigint, dto: any) {
    const data: any = {};
    if (dto.ruleName !== undefined) data.rule_name = dto.ruleName;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.exceptionSeverity !== undefined) data.exception_severity = dto.exceptionSeverity;
    if (dto.escalationLevel !== undefined) data.escalation_level = dto.escalationLevel;
    if (dto.timeThresholdMinutes !== undefined) data.time_threshold_minutes = dto.timeThresholdMinutes;
    if (dto.notifyRoles !== undefined) data.notify_roles = dto.notifyRoles;
    if (dto.notifyUsers !== undefined) data.notify_users = dto.notifyUsers;
    if (dto.isActive !== undefined) data.is_active = dto.isActive;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.updatedBy !== undefined) data.updated_by = dto.updatedBy;
    return this.prisma.exception_escalation_rules.updateMany({
      where: { tenant_id: tenantId, rule_id: ruleId },
      data,
    });
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
}
