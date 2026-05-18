import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';
import { REPORT_CACHE_PREFIX } from './report.types';

@Injectable()
export class ReportCacheInvalidatorService {
  private readonly logger = new Logger(ReportCacheInvalidatorService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @OnEvent('inventory.transacted')
  async onInventoryTransacted(payload: { tenantId: string }) {
    await this.invalidateTenantCache(payload.tenantId, 'inventory.transacted');
  }

  @OnEvent('order.status_changed')
  async onOrderStatusChanged(payload: { tenantId: string }) {
    await this.invalidateTenantCache(payload.tenantId, 'order.status_changed');
  }

  private async invalidateTenantCache(tenantId: string, source: string): Promise<void> {
    try {
      const pattern = `${REPORT_CACHE_PREFIX}${tenantId}:*`;
      let cursor = '0';
      let deleted = 0;

      do {
        const result = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = result[0];
        const keys = result[1];
        if (keys.length > 0) {
          await this.redis.del(...keys);
          deleted += keys.length;
        }
      } while (cursor !== '0');

      if (deleted > 0) {
        this.logger.log(`Invalidated ${deleted} report cache entries for tenant ${tenantId} (${source})`);
      }
    } catch (err) {
      this.logger.error(`Cache invalidation failed for tenant ${tenantId}: ${(err as Error).message}`);
    }
  }
}
