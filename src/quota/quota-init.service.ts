import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CoreClientService } from '../core-client/core-client.service';
import { TenantContextService } from '../common/context/tenant-context.service';

@Injectable()
export class QuotaInitService implements OnModuleInit {
  private readonly logger = new Logger(QuotaInitService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly coreClient: CoreClientService,
    private readonly tenantContext: TenantContextService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    if (this.configService.get('NODE_ENV') === 'test') return;

    // Attempt initial sync — fail gracefully if Core is down
    try {
      await this.syncQuotasForAllTenants();
    } catch (err: any) {
      this.logger.warn(
        `Initial quota sync failed (Core may be down): ${err.message}`,
      );
      this.logger.log('Serving stale cached quotas from DB');
    }
  }

  async syncQuotasForAllTenants(): Promise<void> {
    // In WMS, we sync on-demand when a tenant is resolved.
    // This is a placeholder for multi-tenant fan-out.
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
          }
        },
      );

      this.eventEmitter.emit('plan.changed', { tenantId, planLimits });
      this.logger.log(`Quotas synced for tenant ${tenantId}`);
    } catch (err: any) {
      this.logger.error(
        `Failed to sync quotas for tenant ${tenantId}: ${err.message}`,
      );
      throw err;
    }
  }
}
