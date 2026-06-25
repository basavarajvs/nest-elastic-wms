import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEscalationRuleDto } from './dtos/escalation-rule.dto';

@Injectable()
export class ExceptionEscalationService {
  private readonly logger = new Logger(ExceptionEscalationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createRule(dto: CreateEscalationRuleDto, tenantId: string): Promise<any> {
    const ruleCount = await (this.prisma as any).exceptionEscalationRule.count({
      where: { tenantId, facilityId: dto.facilityId },
    });

    const rule = await (this.prisma as any).exceptionEscalationRule.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        ruleName: dto.ruleName,
        exceptionType: dto.exceptionType,
        severityMinimum: dto.severityMinimum,
        unresolvedHours: dto.unresolvedHours,
        escalateToUserId: dto.escalateToUserId,
        notifyViaEmail: dto.notifyViaEmail ?? true,
        isActive: dto.isActive ?? true,
      },
    });

    this.logger.log(`Escalation rule created: ${rule.id} (${dto.ruleName})`);
    return rule;
  }

  async listRules(tenantId: string, facilityId?: string): Promise<any[]> {
    const where: any = { tenantId };
    if (facilityId) where.facilityId = facilityId;

    return (this.prisma as any).exceptionEscalationRule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async checkEscalation(exceptionId: string, tenantId: string): Promise<any[]> {
    const exception = await (this.prisma as any).exceptionManagement.findFirst({
      where: { id: exceptionId, tenantId },
    });
    if (!exception) return [];

    const elapsedHours =
      (Date.now() - new Date(exception.reportedAt).getTime()) / 3600000;

    const matchingRules = await (this.prisma as any).exceptionEscalationRule.findMany({
      where: {
        tenantId,
        facilityId: exception.facilityId,
        exceptionType: exception.exceptionType,
        isActive: true,
        unresolvedHours: { lte: Math.floor(elapsedHours) },
      },
    });

    const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const escalated: any[] = [];

    for (const rule of matchingRules) {
      if (severities.indexOf(exception.severity) >= severities.indexOf(rule.severityMinimum)) {
        escalated.push({
          ruleId: rule.id,
          ruleName: rule.ruleName,
          escalateToUserId: rule.escalateToUserId,
          notifyViaEmail: rule.notifyViaEmail,
        });
      }
    }

    if (escalated.length > 0) {
      this.logger.warn(
        `Escalation triggered for exception ${exceptionId}: ${escalated.length} rule(s) matched`,
      );
    }

    return escalated;
  }
}
