import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CycleCountThresholdService {
  private readonly logger = new Logger(CycleCountThresholdService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getThresholdForFacility(tenantId: string, facilityId: bigint) {
    return this.prisma.approval_threshold_configs.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, is_active: true },
    });
  }

  async evaluateVariance(tenantId: string, facilityId: bigint, systemQty: number, countedQty: number) {
    const config = await this.getThresholdForFacility(tenantId, facilityId);
    if (!config) {
      return { action: 'SUPERVISOR_REVIEW', reason: 'No threshold config' };
    }
    const variance = Math.abs(countedQty - systemQty);
    const pct = systemQty > 0 ? (variance / systemQty) * 100 : 100;

    if (config.threshold_type === 'PERCENTAGE') {
      if (pct <= Number(config.auto_approve_pct || 2)) return { action: 'AUTO_APPROVE', reason: 'Within auto-approve threshold' };
      if (pct <= Number(config.supervisor_review_pct || 10)) return { action: 'SUPERVISOR_REVIEW', reason: 'Exceeds auto-approve' };
      if (config.recount_pct && pct > Number(config.recount_pct)) return { action: 'RECOUNT', reason: 'Exceeds recount threshold' };
    }
    return { action: 'SUPERVISOR_REVIEW', reason: 'Default review required' };
  }

  async upsert(tenantId: string, dto: any) {
    const existing = await this.prisma.approval_threshold_configs.findFirst({
      where: { tenant_id: tenantId, facility_id: BigInt(dto.facilityId), is_active: true },
    });
    if (existing) {
      return this.prisma.approval_threshold_configs.updateMany({
        where: { tenant_id: tenantId, config_id: existing.config_id },
        data: {
          threshold_type: dto.thresholdType || 'PERCENTAGE',
          auto_approve_pct: dto.autoApprovePct,
          supervisor_review_pct: dto.supervisorReviewPct,
          recount_pct: dto.recountPct,
        },
      });
    }
    return this.prisma.approval_threshold_configs.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        threshold_type: dto.thresholdType || 'PERCENTAGE',
        auto_approve_pct: dto.autoApprovePct,
        supervisor_review_pct: dto.supervisorReviewPct,
        recount_pct: dto.recountPct,
        is_active: true,
      },
    });
  }

  async findAll(tenantId: string, facilityId: bigint) {
    return this.prisma.approval_threshold_configs.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId },
    });
  }
}
