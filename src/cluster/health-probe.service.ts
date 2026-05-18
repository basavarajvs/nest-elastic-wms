import { Injectable, Logger, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';
import { PrismaService } from '../prisma/prisma.service';
import { CoreClientService } from '../core-client/core-client.service';
import { ConnectionPoolWarmerService } from './connection-pool-warmer.service';

@Injectable()
export class HealthProbeService {
  private readonly logger = new Logger(HealthProbeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly coreClient: CoreClientService,
    private readonly poolWarmer: ConnectionPoolWarmerService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async checkLiveness(): Promise<boolean> {
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async checkReadiness(): Promise<{ ready: boolean; details: Record<string, string> }> {
    const details: Record<string, string> = {};
    let ready = true;

    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      details.db = 'connected';
    } catch (err: any) {
      details.db = `disconnected: ${err.message}`;
      ready = false;
    }

    try {
      await this.redis.ping();
      details.redis = 'connected';
    } catch (err: any) {
      details.redis = `disconnected: ${err.message}`;
      ready = false;
    }

    try {
      const coreHealthy = await this.coreClient.healthCheck();
      details.core = coreHealthy ? 'reachable' : 'unreachable';
    } catch {
      details.core = 'unreachable';
      ready = false;
    }

    const migrationsComplete = await this.checkMigrationsComplete();
    details.migrations = migrationsComplete ? 'complete' : 'pending';
    if (!migrationsComplete) ready = false;

    const poolReady = this.poolWarmer.isReady();
    details.pool_warmed = poolReady ? 'yes' : 'no';
    if (!poolReady) ready = false;

    return { ready, details };
  }

  private async checkMigrationsComplete(): Promise<boolean> {
    try {
      const result = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*)::int as count FROM _prisma_migrations WHERE finished_at IS NULL`,
      );
      return Number(result[0]?.count || 0) === 0;
    } catch {
      return true;
    }
  }
}
