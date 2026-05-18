import { Injectable, Logger, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const LRU_CAPACITY = 10000;
const DECAY_PCT = 0.5;

@Injectable()
export class RateLimiterFailoverService {
  private readonly logger = new Logger(RateLimiterFailoverService.name);
  private readonly lruCache = new Map<string, TokenBucket>();
  private degraded = false;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async check(key: string, limit: number, ttlMs: number): Promise<{ allowed: boolean; retryAfterMs: number }> {
    try {
      await this.redis.ping();
      if (this.degraded) {
        this.degraded = false;
        this.logger.log('Rate limiter recovered — Redis available');
      }
      return await this.checkRedis(key, limit, ttlMs);
    } catch {
      if (!this.degraded) {
        this.degraded = true;
        this.logger.error('rate_limit.degraded — Redis down, switching to in-memory LRU');
      }
      return this.checkInMemory(key, Math.floor(limit * DECAY_PCT), ttlMs);
    }
  }

  async bypass(key: string): Promise<void> {
    try {
      await this.redis.del(`rl:${key}`);
    } catch {
      this.lruCache.delete(key);
    }
  }

  isDegraded(): boolean {
    return this.degraded;
  }

  private async checkRedis(key: string, limit: number, ttlMs: number): Promise<{ allowed: boolean; retryAfterMs: number }> {
    const now = Date.now();
    const script = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local ttl = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local current = redis.call('INCR', key)
      if current == 1 then
        redis.call('PEXPIRE', key, ttl)
      end
      if current > limit then
        local pttl = redis.call('PTTL', key)
        return {0, pttl}
      end
      return {1, 0}
    `;
    const result = await this.redis.eval(script, 1, `rl:${key}`, limit.toString(), ttlMs.toString(), now.toString()) as [number, number];
    return { allowed: result[0] === 1, retryAfterMs: result[1] || Math.ceil(ttlMs / (limit / 2)) };
  }

  private checkInMemory(key: string, limit: number, ttlMs: number): { allowed: boolean; retryAfterMs: number } {
    const now = Date.now();
    let bucket = this.lruCache.get(key);

    if (!bucket) {
      if (this.lruCache.size >= LRU_CAPACITY) {
        const firstKey = this.lruCache.keys().next().value;
        if (firstKey) this.lruCache.delete(firstKey);
      }
      bucket = { tokens: limit, lastRefill: now };
      this.lruCache.set(key, bucket);
    }

    const elapsed = now - bucket.lastRefill;
    const refillRate = limit / ttlMs;
    bucket.tokens = Math.min(limit, bucket.tokens + elapsed * refillRate);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return { allowed: true, retryAfterMs: 0 };
    }

    const waitMs = Math.ceil((1 - bucket.tokens) / refillRate);
    return { allowed: false, retryAfterMs: Math.max(waitMs, 100) };
  }
}
