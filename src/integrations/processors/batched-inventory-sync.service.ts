import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../../common/cache/redis.constants';

const SLIDING_WINDOW_MS = 60_000;
const AGG_KEY_PREFIX = 'inv:batch:';

interface BatchEntry {
  productId: string;
  externalVariantId: string;
  facilityId: string;
  quantityDelta: number;
}

@Injectable()
export class BatchedInventorySyncService {
  private readonly logger = new Logger(BatchedInventorySyncService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async accumulate(tenantId: string, entry: BatchEntry): Promise<void> {
    const windowKey = `${AGG_KEY_PREFIX}${tenantId}:${entry.externalVariantId}:${this.windowSlot()}`;

    await this.redis.multi()
      .hincrby(windowKey, 'quantityDelta', Math.round(entry.quantityDelta))
      .hsetnx(windowKey, 'externalVariantId', entry.externalVariantId)
      .hsetnx(windowKey, 'facilityId', entry.facilityId)
      .hsetnx(windowKey, 'productId', entry.productId)
      .expire(windowKey, Math.ceil(SLIDING_WINDOW_MS / 1000) * 2)
      .exec();
  }

  async flushReadyBatches(tenantId: string): Promise<BatchEntry[]> {
    const keys = await this.redis.keys(`${AGG_KEY_PREFIX}${tenantId}:*`);
    if (keys.length === 0) return [];

    const now = Date.now();
    const entries: BatchEntry[] = [];

    for (const key of keys) {
      const ttl = await this.redis.ttl(key);
      const age = SLIDING_WINDOW_MS / 1000 - ttl;

      if (age >= SLIDING_WINDOW_MS / 1000) {
        const data = await this.redis.hgetall(key);
        const qty = parseInt(data.quantityDelta || '0', 10);
        if (qty !== 0) {
          entries.push({
            productId: data.productId,
            externalVariantId: data.externalVariantId,
            facilityId: data.facilityId,
            quantityDelta: qty,
          });
        }
        await this.redis.del(key);
      }
    }

    return entries;
  }

  private windowSlot(): number {
    return Math.floor(Date.now() / SLIDING_WINDOW_MS);
  }
}
