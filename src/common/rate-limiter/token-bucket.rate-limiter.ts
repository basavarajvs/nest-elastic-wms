import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../cache/redis.constants';

interface BucketConfig {
  capacity: number;
  refillRate: number;
  refillIntervalMs: number;
}

const BUCKET_CONFIGS: Record<string, BucketConfig> = {
  SHOPIFY: { capacity: 40, refillRate: 2, refillIntervalMs: 1000 },
  WOOCOMMERCE: { capacity: 100, refillRate: 100, refillIntervalMs: 60000 },
  SCANNER_VALIDATE: { capacity: 50, refillRate: 50, refillIntervalMs: 1000 },
};

@Injectable()
export class TokenBucketRateLimiter {
  private readonly logger = new Logger(TokenBucketRateLimiter.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async consume(bucketKey: string, tokens: number = 1): Promise<boolean> {
    const config = this.getConfig(bucketKey);
    if (!config) return true;

    const key = `ratelimit:${bucketKey}`;
    const now = Date.now();

    const result = await this.redis.eval(
      `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refillRate = tonumber(ARGV[2])
      local refillInterval = tonumber(ARGV[3])
      local tokens = tonumber(ARGV[4])
      local now = tonumber(ARGV[5])

      local data = redis.call('get', key)
      local bucket
      if data then
        bucket = cjson.decode(data)
        local elapsed = now - bucket.ts
        local refill = math.floor(elapsed / refillInterval) * refillRate
        bucket.tokens = math.min(capacity, bucket.tokens + refill)
        bucket.ts = bucket.ts + (refill * refillInterval)
      else
        bucket = { tokens = capacity, ts = now }
      end

      if bucket.tokens >= tokens then
        bucket.tokens = bucket.tokens - tokens
        redis.call('setex', key, 3600, cjson.encode(bucket))
        return 1
      else
        redis.call('setex', key, 3600, cjson.encode(bucket))
        return 0
      end
      `,
      1,
      key,
      config.capacity,
      config.refillRate,
      config.refillIntervalMs,
      tokens,
      now,
    );

    return result === 1;
  }

  async getRemainingTokens(bucketKey: string): Promise<number> {
    const config = this.getConfig(bucketKey);
    if (!config) return -1;

    const key = `ratelimit:${bucketKey}`;
    const data = await this.redis.get(key);
    if (!data) return config.capacity;

    const bucket = JSON.parse(data);
    const elapsed = Date.now() - bucket.ts;
    const refill = Math.floor(elapsed / config.refillIntervalMs) * config.refillRate;
    return Math.min(config.capacity, bucket.tokens + refill);
  }

  private getConfig(bucketKey: string): BucketConfig | null {
    for (const [prefix, config] of Object.entries(BUCKET_CONFIGS)) {
      if (bucketKey.startsWith(prefix)) return config;
    }
    return null;
  }
}
