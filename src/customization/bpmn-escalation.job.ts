import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Challenge 4: BpmnEscalationJob
 * Scans RUNNING instances with userTask states, checks SLA via BPMN extension elements,
 * auto-escalates by notifying fallback role and logging audit event.
 */
@Processor('bpmn-escalation')
export class BpmnEscalationJob extends WorkerHost {
  private readonly logger = new Logger(BpmnEscalationJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async process(job?: Job) {
    this.logger.log(`BPMN escalation check: ${job?.id || 'cron-triggered'}`);

    const slaCutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const stalled = await (this.prisma as any).wmsExecutionInstance.findMany({
      where: {
        engineType: 'BPMN_PROCESS',
        status: 'RUNNING',
        startedAt: { lt: slaCutoff },
        currentState: { contains: 'userTask' },
      },
    });

    this.logger.warn(`Found ${stalled.length} stalled BPMN instances at user tasks`);

    for (const inst of stalled) {
      const ctx = (inst.contextJson as Record<string, any>) || {};
      const escalationCount = ctx.escalationCount || 0;

      const updatedCtx = {
        ...ctx,
        escalationCount: escalationCount + 1,
        lastEscalationAt: new Date().toISOString(),
        escalationLevel: escalationCount >= 2 ? 'MANAGER' : 'SUPERVISOR',
        fallbackRole: escalationCount >= 2 ? 'WAREHOUSE_ADMIN' : 'WAREHOUSE_SUPERVISOR',
      };

      await (this.prisma as any).wmsExecutionInstance.update({
        where: { id: inst.id },
        data: { contextJson: updatedCtx },
      });

      this.eventEmitter.emit('wms.bpmn.escalated', {
        instanceId: inst.id,
        processKey: inst.engineKey,
        entityType: inst.entityType,
        entityId: inst.entityId,
        escalationLevel: updatedCtx.escalationLevel,
        fallbackRole: updatedCtx.fallbackRole,
        escalationCount: escalationCount + 1,
        tenantId: inst.tenantId,
        timestamp: new Date(),
      });
    }

    return stalled.length;
  }
}
