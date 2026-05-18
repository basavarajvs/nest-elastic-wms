import { Injectable, Logger, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';

interface BucketState {
  tokens: number;
  lastRefill: number;
}

const BURST_MAX = 500;
const BURST_WINDOW_MS = 10000;
const SUSTAINED_RATE = 50;
const SUSTAINED_WINDOW_MS = 1000;

@Injectable()
export class RfRateLimiterGuard {
  private readonly logger = new Logger(RfRateLimiterGuard.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async checkCompositeKey(ip: string, deviceId: string): Promise<{ allowed: boolean; retryAfterMs: number }> {
    const key = `rl:rf:${ip}:${deviceId}`;
    const sustainedKey = `rl:rf:${ip}:${deviceId}:sustained`;

    try {
      const [burstAllowed, sustainedAllowed] = await Promise.all([
        this.checkRedisTokenBucket(key, BURST_MAX, BURST_WINDOW_MS),
        this.checkRedisTokenBucket(sustainedKey, SUSTAINED_RATE * 10, SUSTAINED_WINDOW_MS * 10),
      ]);

      if (!burstAllowed) {
        return { allowed: false, retryAfterMs: 2000 };
      }

      const withinSustained = await this.checkSustainedRate(sustainedKey, SUSTAINED_RATE, SUSTAINED_WINDOW_MS);
      if (!withinSustained) {
        return { allowed: false, retryAfterMs: 1000 };
      }

      return { allowed: true, retryAfterMs: 0 };
    } catch {
      return { allowed: true, retryAfterMs: 0 };
    }
  }

  private async checkRedisTokenBucket(key: string, maxTokens: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const script = `
      local key = KEYS[1]
      local max_tokens = tonumber(ARGV[1])
      local window_ms = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local bucket = redis.call('HGETALL', key)
      local tokens = max_tokens
      local last_refill = now
      if #bucket > 0 then
        tokens = tonumber(bucket[2] or max_tokens)
        last_refill = tonumber(bucket[4] or now)
        local elapsed = math.max(0, now - last_refill)
        local refill = math.floor((elapsed / window_ms) * max_tokens)
        tokens = math.min(max_tokens, tokens + refill)
      end
      if tokens >= 1 then
        tokens = tokens - 1
        redis.call('HSET', key, 'tokens', tokens, 'lastRefill', now)
        redis.call('PEXPIRE', key, window_ms)
        return 1
      end
      redis.call('HSET', key, 'tokens', 0, 'lastRefill', last_refill)
      redis.call('PEXPIRE', key, window_ms)
      return 0
    `;
    const result = await this.redis.eval(script, 1, key, maxTokens.toString(), windowMs.toString(), now.toString()) as number;
    return result === 1;
  }

  private async checkSustainedRate(key: string, maxPerSec: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - windowMs;
    await this.redis.zremrangebyscore(key, 0, windowStart);
    const count = await this.redis.zcard(key);
    if (count >= maxPerSec) return false;
    await this.redis.zadd(key, now, `${now}:${Math.random()}`);
    await this.redis.pexpire(key, windowMs * 2);
    return true;
  }
}
