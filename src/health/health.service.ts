import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CoreClientService } from '../core-client/core-client.service';
import Redis from 'ioredis';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../common/cache/redis.constants';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly coreClient: CoreClientService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {}

  async checkHealth() {
    const [dbStatus, redisStatus, coreStatus, productCount, inboundActive, outboundPendingPicks, pendingApprovals, inProgressCounts] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkCore(),
      this.checkProductCount(),
      this.inboundActiveReceipts(),
      this.outboundPendingPicks(),
      this.pendingApprovals(),
      this.inProgressCounts(),
    ]);

    const allGood = dbStatus === 'connected' && redisStatus === 'connected';
    const degraded = coreStatus !== 'ok';

    return {
      status: allGood ? 'ok' : 'down',
      ...(degraded && allGood ? { status: 'degraded' } : {}),
      db: dbStatus,
      redis: redisStatus,
      core: coreStatus,
      products: productCount,
      inboundActiveReceipts: inboundActive,
      outboundPendingPicks,
      pendingApprovals,
      inProgressCounts,
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
      const result = await (this.prisma as any).inventoryTransaction.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });
      return result;
    } catch {
      return -1;
    }
  }
}
