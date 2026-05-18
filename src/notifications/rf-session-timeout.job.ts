import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

const SESSION_TTL_MINUTES = 15;
const IDLE_THRESHOLD_MS = SESSION_TTL_MINUTES * 60 * 1000;

@Injectable()
export class RfSessionTimeoutJob {
  private readonly logger = new Logger(RfSessionTimeoutJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkStaleSessions(): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - IDLE_THRESHOLD_MS);
      const staleSessions = await (this.prisma as any).dbRfSession.findMany({
        where: {
          status: { not: 'completed' },
          updatedAt: { lt: cutoff },
        },
      });

      for (const session of staleSessions) {
        const stateData = (session.state || {}) as Record<string, any>;
        const hadTask = !!(stateData.assignedTask || stateData.taskId);
        if (!hadTask) continue;

        this.eventEmitter.emit('rf.session.timeout', {
          sessionId: session.id,
          userId: session.userId,
          workflow: session.workflow,
          idleMinutes: Math.floor(
            (Date.now() - new Date(session.updatedAt).getTime()) / 60000,
          ),
          hadTask: true,
          tenantId: session.tenantId,
        });

        this.logger.warn(
          `RF session timeout detected: ${session.id} (user: ${session.userId}, idle: ${SESSION_TTL_MINUTES}+ min)`,
        );
      }
    } catch (err: any) {
      this.logger.error(`Stale session check failed: ${err.message}`);
    }
  }
}
