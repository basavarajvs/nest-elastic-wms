import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CoreClientService } from '../core-client/core-client.service';
import { QUOTA_SYNC_QUEUE } from './quota-sync.constants';

const RESOURCE_TYPE_MAP: Record<string, string> = {
  maxUsers: 'users',
  maxStorageLocations: 'storage_locations',
  maxProducts: 'products',
  maxMonthlyTransactions: 'monthly_transactions',
  maxFacilities: 'facilities',
  storageGb: 'storage_gb',
};

@Injectable()
export class QuotaInitService implements OnModuleInit {
  private readonly logger = new Logger(QuotaInitService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly coreClient: CoreClientService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(QUOTA_SYNC_QUEUE) private readonly retryQueue: Queue,
  ) {}

  async onModuleInit() {
    try {
      await this.syncQuotasForAllTenants();
    } catch (err) {
      this.logger.error(`Initial quota sync failed: ${(err as Error).message}`);
    }
  }

  async syncQuotasForAllTenants(): Promise<void> {
    const rows = await this.prisma.$queryRawUnsafe<{ tenant_id: string }[]>(
      `SELECT DISTINCT tenant_id FROM multitenant.warehouse_facilities WHERE is_active = true`,
    );

    const tenantIds = rows.map((r) => r.tenant_id);
    this.logger.log(`Syncing quotas for ${tenantIds.length} tenants`);

    for (const tenantId of tenantIds) {
      try {
        await this.syncQuotasForTenant(tenantId);
      } catch (err) {
        this.logger.error(`Quota sync failed for tenant ${tenantId}: ${(err as Error).message}`);
        await this.retryQueue.add('sync', { tenantId }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        });
      }
    }
  }

  async syncQuotasForTenant(tenantId: string): Promise<void> {
    const limits = await this.coreClient.getPlanLimits(tenantId);

    for (const [key, resourceType] of Object.entries(RESOURCE_TYPE_MAP)) {
      const limitAmount = (limits as any)[key];
      if (limitAmount == null) continue;

      const existing = await this.prisma.$queryRawUnsafe<{ current_usage: number }[]>(
        `SELECT current_usage FROM multitenant.resource_quotas
         WHERE tenant_id = $1::uuid AND resource_type = $2`,
        tenantId,
        resourceType,
      );

      const currentUsage = existing.length > 0 ? Number(existing[0].current_usage) : 0;

      await this.prisma.$executeRawUnsafe(
        `INSERT INTO multitenant.resource_quotas (tenant_id, resource_type, current_usage, limit_amount)
         VALUES ($1::uuid, $2, $3, $4)
         ON CONFLICT (tenant_id, resource_type) DO UPDATE
         SET limit_amount = EXCLUDED.limit_amount`,
        tenantId,
        resourceType,
        currentUsage,
        limitAmount,
      );

      if (limitAmount > 0 && currentUsage / limitAmount > 0.8) {
        this.logger.warn(
          `Quota warning for tenant ${tenantId}, resource ${resourceType}: ${currentUsage}/${limitAmount} (${((currentUsage / limitAmount) * 100).toFixed(1)}%)`,
        );
        this.eventEmitter.emit('quota.warning', {
          tenantId,
          resourceType,
          currentUsage,
          limitAmount,
          utilizationPct: ((currentUsage / limitAmount) * 100).toFixed(1),
        });
      }
    }
  }
}
