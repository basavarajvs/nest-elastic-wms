import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../../common/cache/redis.constants';

const BUFFER_TTL = 300;
const MAX_RETRIES = 6;

@Injectable()
export class PendingOrderBufferService {
  private readonly logger = new Logger(PendingOrderBufferService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async holdEvent(tenantId: string, externalOrderId: string, eventType: string, payload: any): Promise<void> {
    const key = `order:buffer:${tenantId}:${externalOrderId}`;
    const exists = await this.redis.hexists(key, eventType);
    if (exists) return;

    await this.redis.hset(key, {
      [eventType]: JSON.stringify(payload),
      created_at: eventType === 'orders/create' ? Date.now().toString() : (await this.redis.hget(key, 'created_at')) || Date.now().toString(),
    });
    await this.redis.expire(key, BUFFER_TTL);
  }

  async hasCreateEvent(tenantId: string, externalOrderId: string): Promise<boolean> {
    return (await this.redis.hexists(`order:buffer:${tenantId}:${externalOrderId}`, 'orders/create')) === 1;
  }

  async getAndFlush(tenantId: string, externalOrderId: string): Promise<Record<string, any> | null> {
    const key = `order:buffer:${tenantId}:${externalOrderId}`;
    const raw = await this.redis.hgetall(key);
    if (!raw || Object.keys(raw).length === 0) return null;

    await this.redis.del(key);
    return Object.entries(raw)
      .filter(([k]) => k !== 'created_at')
      .reduce((acc, [k, v]) => ({ ...acc, [k]: JSON.parse(v) }), {} as any);
  }

  async flushReadyBuffers(tenantId: string, platform: string): Promise<string[]> {
    const pattern = `order:buffer:${tenantId}:*`;
    const keys: string[] = [];
    let cursor = '0';

    do {
      const result = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = result[0];
      keys.push(...result[1]);
    } while (cursor !== '0');

    const readyOrderIds: string[] = [];

    for (const key of keys) {
      const externalOrderId = key.split(':').pop()!;
      const hasCreate = await this.redis.hexists(key, 'orders/create');
      const createdAt = parseInt(await this.redis.hget(key, 'created_at') || '0', 10);

      if (hasCreate) {
        readyOrderIds.push(externalOrderId);
      } else if (Date.now() - createdAt > BUFFER_TTL * 1000) {
        this.logger.warn(`Buffer timeout for order ${externalOrderId} — no create event arrived`);
        readyOrderIds.push(externalOrderId);
      }
    }

    return readyOrderIds;
  }
}
