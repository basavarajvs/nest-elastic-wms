import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CoreClientService } from '../core-client/core-client.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';
import { PRODUCT_SYNC_QUEUE } from '../integrations/processors/inbound-product-sync.processor';
import { ORDER_SYNC_QUEUE } from '../integrations/processors/inbound-order-sync.processor';
import { INVENTORY_SYNC_QUEUE } from '../integrations/processors/outbound-inventory-sync.processor';
import { ScannerTelemetryService } from '../scanner/scanner-telemetry.service';
import { CoreIntegrationClientService } from '../integrations/core-integration-client.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly coreClient: CoreClientService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly configService: ConfigService,
    @InjectQueue('wms-notifications') private readonly notifQueue: Queue,
    @InjectQueue('wms-reports') private readonly reportsQueue: Queue,
    @InjectQueue(PRODUCT_SYNC_QUEUE) private readonly productSyncQueue: Queue,
    @InjectQueue(ORDER_SYNC_QUEUE) private readonly orderSyncQueue: Queue,
    @InjectQueue(INVENTORY_SYNC_QUEUE) private readonly inventorySyncQueue: Queue,
    private readonly scannerTelemetry: ScannerTelemetryService,
    private readonly coreIntegrationClient: CoreIntegrationClientService,
  ) {}

  async checkHealth() {
    const [dbStatus, redisStatus, coreStatus, notifQueueStatus, reportsQueueStatus, productCount, inboundActive, outboundPendingPicks, pendingApprovals, inProgressCounts, integrationsStatus, scannerSessions, integrationProductQueue, integrationOrderQueue, integrationInventoryQueue] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkCore(),
      this.checkNotificationQueue(),
      this.checkReportsQueue(),
      this.checkProductCount(),
      this.inboundActiveReceipts(),
      this.outboundPendingPicks(),
      this.pendingApprovals(),
      this.inProgressCounts(),
      this.checkIntegrations(),
      this.scannerTelemetry.getActiveSessionCount(),
      this.checkQueueHealth(PRODUCT_SYNC_QUEUE, this.productSyncQueue),
      this.checkQueueHealth(ORDER_SYNC_QUEUE, this.orderSyncQueue),
      this.checkQueueHealth(INVENTORY_SYNC_QUEUE, this.inventorySyncQueue),
    ]);

    const allGood = dbStatus === 'connected' && redisStatus === 'connected';

    return {
      status: allGood ? 'ok' : 'down',
      db: dbStatus,
      redis: redisStatus,
      core: coreStatus,
      notifications_queue: notifQueueStatus,
      reports_queue: reportsQueueStatus,
      core_reachable: coreStatus === 'ok',
      products: productCount,
      inboundActiveReceipts: inboundActive,
      outboundPendingPicks,
      pendingApprovals,
      inProgressCounts,
      integrations: integrationsStatus,
      scanner_sessions_active: scannerSessions,
      integration_queues: {
        product_sync: integrationProductQueue,
        order_sync: integrationOrderQueue,
        inventory_push: integrationInventoryQueue,
      },
      version: '1.0.0-wms',
    };
  }

  private async checkDatabase(): Promise<string> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'connected';
    } catch (err: any) {
      this.logger.error(`DB health check failed: ${err.message}`);
      return 'disconnected';
    }
  }

  private async checkRedis(): Promise<string> {
    try {
      await this.redis.ping();
      return 'connected';
    } catch (err: any) {
      this.logger.error(`Redis health check failed: ${err.message}`);
      return 'disconnected';
    }
  }

  private async checkCore(): Promise<string> {
    try {
      const healthy = await this.coreClient.healthCheck();
      return healthy ? 'ok' : 'unreachable';
    } catch {
      return 'unreachable';
    }
  }

  private async checkProductCount(): Promise<number> {
    try {
      const count = await (this.prisma as any).product.count();
      return count;
    } catch {
      return -1;
    }
  }

  async inboundActiveReceipts(): Promise<number> {
    try {
      const result = await (this.prisma as any).goodsReceipt.count({
        where: {
          status: { in: ['RECEIVING', 'INSPECTION_IN_PROGRESS'] },
        },
      });
      return result;
    } catch {
      return -1;
    }
  }

  async outboundPendingPicks(): Promise<number> {
    try {
      const result = await (this.prisma as any).pickingTask.count({
        where: {
          status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
        },
      });
      return result;
    } catch {
      return -1;
    }
  }

  async pendingApprovals(): Promise<number> {
    try {
      const result = await (this.prisma as any).adjustmentApproval.count({
        where: {
          status: 'PENDING',
        },
      });
      return result;
    } catch {
      return -1;
    }
  }

  async inProgressCounts(): Promise<number> {
    try {
      const result = await (this.prisma as any).cycleCount.count({
        where: {
          status: { in: ['IN_PROGRESS', 'COLLECTING'] },
        },
      });
      return result;
    } catch {
      return -1;
    }
  }

  async inventoryTransactionsLast24h(): Promise<number> {
    try {
      const count = await (this.prisma as any).inventoryTransaction.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });
      return count;
    } catch {
      return -1;
    }
  }

  private async checkNotificationQueue(): Promise<string> {
    try {
      const [waiting, active, failed] = await Promise.all([
        this.notifQueue.getWaitingCount(),
        this.notifQueue.getActiveCount(),
        this.notifQueue.getFailedCount(),
      ]);
      if (failed > 0) return 'stalled';
      if (active > 0 || waiting > 0) return 'active';
      return 'active';
    } catch {
      return 'unreachable';
    }
  }

  private async checkIntegrations(): Promise<Record<string, string>> {
    const circuits = this.coreIntegrationClient.getAllCircuitStates();
    const result: Record<string, string> = { shopify: 'ok', woocommerce: 'ok' };

    for (const [key, state] of Object.entries(circuits)) {
      if (key.includes('SHOPIFY')) {
        result.shopify = state === 'OPEN' ? 'degraded' : 'ok';
      } else if (key.includes('WOOCOMMERCE') || key.includes('woocommerce')) {
        result.woocommerce = state === 'OPEN' ? 'degraded' : 'ok';
      }
    }

    return result;
  }

  private async checkQueueHealth(name: string, queue: Queue): Promise<string> {
    try {
      const [waiting, active, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getFailedCount(),
      ]);
      if (failed > 0) return 'stalled';
      return 'active';
    } catch {
      return 'unreachable';
    }
  }

  private async checkReportsQueue(): Promise<string> {
    try {
      const [waiting, active, failed] = await Promise.all([
        this.reportsQueue.getWaitingCount(),
        this.reportsQueue.getActiveCount(),
        this.reportsQueue.getFailedCount(),
      ]);
      if (failed > 0) return 'stalled';
      return 'active';
    } catch {
      return 'unreachable';
    }
  }
}
