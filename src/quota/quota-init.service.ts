import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CoreClientService } from '../core-client/core-client.service';
import { TenantContextService } from '../common/context/tenant-context.service';
import { RedisPubSubService } from '../cluster/redis-pubsub.service';
import { QUOTA_SYNC_QUEUE } from './quota-sync.constants';

@Injectable()
export class QuotaInitService implements OnModuleInit {
  private readonly logger = new Logger(QuotaInitService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly coreClient: CoreClientService,
    private readonly tenantContext: TenantContextService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    private readonly redisPubSub: RedisPubSubService,
    @InjectQueue(QUOTA_SYNC_QUEUE) private readonly quotaSyncQueue: Queue,
  ) {}

  async onModuleInit() {
    if (this.configService.get('NODE_ENV') === 'test') return;

    try {
      await this.syncQuotasForAllTenants();
    } catch (err: any) {
      this.logger.warn(
        `Initial quota sync failed (Core may be down): ${err.message}`,
      );
      this.logger.log('Serving stale cached quotas from DB');
      await this.quotaSyncQueue.add('sync-retry', { tenantId: 'all' });
    }
  }

  async syncQuotasForAllTenants(): Promise<void> {
    this.logger.log('Quota sync service initialized — per-tenant sync on demand');
  }

  async syncQuotasFromCore(tenantId: string): Promise<void> {
    try {
      const planLimits = await this.coreClient.getPlanLimits(tenantId);

      await this.tenantContext.run(
        {
          tenantId,
          tenantCode: '',
          tenantStatus: 'active',
          isSystemContext: true,
        },
        async () => {
          for (const limit of planLimits.limits) {
            await (this.prisma as any).resourceQuota.upsert({
              where: {
                resource_quotas_type_uq: {
                  tenantId,
                  resourceType: limit.resourceType,
                },
              },
              update: {
                limitAmount: limit.limitAmount,
                currentUsage: limit.currentUsage,
              },
              create: {
                tenantId,
                resourceType: limit.resourceType,
                limitAmount: limit.limitAmount,
                currentUsage: limit.currentUsage,
              },
            });

            const usagePercent =
              limit.limitAmount > 0
                ? (limit.currentUsage / limit.limitAmount) * 100
                : 0;
            if (usagePercent > 80) {
              this.eventEmitter.emit('quota.warning', {
                resourceType: limit.resourceType,
                usagePercent,
                limitAmount: limit.limitAmount,
                currentUsage: limit.currentUsage,
                tenantId,
              });
            }
          }
        },
      );

      this.eventEmitter.emit('plan.changed', { tenantId, planLimits });
      await this.redisPubSub.publish('wms:quota:sync', { tenantId, planLimits });
      this.logger.log(`Quotas synced for tenant ${tenantId}`);
    } catch (err: any) {
      this.logger.error(
        `Failed to sync quotas for tenant ${tenantId}: ${err.message}`,
      );
      await this.quotaSyncQueue.add(
        'sync-retry',
        { tenantId },
        { attempts: 5, backoff: { type: 'exponential', delay: 300000 } },
      );
      throw err;
    }
  }

  async getCachedQuota(tenantId: string, resourceType: string): Promise<{ limitAmount: number; currentUsage: number } | null> {
    try {
      const quota = await (this.prisma as any).resourceQuota.findFirst({
        where: { tenantId, resourceType },
      });
      if (quota) {
        return { limitAmount: quota.limitAmount, currentUsage: quota.currentUsage };
      }
      return null;
    } catch {
      return null;
    }
  }
}
