import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { WmsNotificationClientService } from '../wms-notification-client.service';
import { WmsNotificationType } from '../wms-notification.types';

const VARIANCE_THRESHOLD = 5;

@Injectable()
export class SystemListener {
  private readonly logger = new Logger(SystemListener.name);

  constructor(
    private readonly client: WmsNotificationClientService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('rf.session.timeout')
  async handleRfSessionTimeout(payload: {
    sessionId: string;
    userId: string;
    workflow: string;
    idleMinutes: number;
    hadTask: boolean;
    tenantId: string;
  }) {
    try {
      if (!payload.hadTask) return;

      await this.client.dispatch({
        type: WmsNotificationType.RF_SESSION_TIMEOUT,
        tenantId: payload.tenantId,
        recipients: [{ roleCode: 'WAREHOUSE_SUPERVISOR' }],
        variables: {
          sessionId: payload.sessionId,
          userId: payload.userId,
          workflow: payload.workflow,
          idleMinutes: payload.idleMinutes,
          hadTask: payload.hadTask,
        },
        priority: 'high',
        bypassPreferences: true,
      });
    } catch (err: any) {
      this.logger.error(`RF session timeout listener failed: ${err.message}`);
    }
  }

  @OnEvent('quota.warning')
  async handleQuotaWarning(payload: {
    resourceType: string;
    usagePercent: number;
    limitAmount: number;
    currentUsage: number;
    tenantId: string;
  }) {
    try {
      await this.client.dispatch({
        type: WmsNotificationType.SYSTEM_QUOTA_WARNING,
        tenantId: payload.tenantId,
        recipients: [{ roleCode: 'TENANT_ADMIN' }],
        variables: {
          resourceType: payload.resourceType,
          usagePercent: payload.usagePercent,
          limitAmount: payload.limitAmount,
          currentUsage: payload.currentUsage,
        },
        priority: 'high',
        bypassPreferences: true,
      });
    } catch (err: any) {
      this.logger.error(`Quota warning listener failed: ${err.message}`);
    }
  }

  @OnEvent('count.completed')
  async handleCycleCountCompleted(payload: {
    countId: string;
    tenantId: string;
  }) {
    try {
      const count = await (this.prisma as any).cycleCount.findFirst({
        where: { id: payload.countId, tenantId: payload.tenantId },
        include: { lines: true },
      });
      if (!count) return;

      const significantVariances = (count.lines || []).filter((line: any) => {
        const variance = Math.abs(line.systemQuantity - (line.countedQuantity || 0));
        const pct = line.systemQuantity > 0
          ? (variance / line.systemQuantity) * 100
          : variance > 0 ? 100 : 0;
        return pct >= VARIANCE_THRESHOLD;
      });

      if (significantVariances.length === 0) return;

      const maxVar = significantVariances.reduce((max: any, l: any) => {
        const v = Math.abs(l.systemQuantity - (l.countedQuantity || 0));
        return v > (max.v || 0) ? { line: l, v } : max;
      }, { v: 0 });

      await this.client.dispatch({
        type: WmsNotificationType.CYCLE_COUNT_VARIANCE,
        tenantId: payload.tenantId,
        recipients: [{ roleCode: 'WAREHOUSE_ADMIN' }],
        variables: {
          countNumber: count.countNumber || payload.countId,
          productCode: maxVar.line?.productId || '',
          locationCode: maxVar.line?.locationId || '',
          systemQuantity: maxVar.line?.systemQuantity || 0,
          countedQuantity: maxVar.line?.countedQuantity || 0,
          variancePercentage: maxVar.v > 0 && maxVar.line?.systemQuantity > 0
            ? (maxVar.v / maxVar.line.systemQuantity) * 100
            : maxVar.v > 0 ? 100 : 0,
        },
        priority: 'normal',
      });
    } catch (err: any) {
      this.logger.error(
        `Cycle count listener failed: ${err.message}`,
      );
    }
  }
}
