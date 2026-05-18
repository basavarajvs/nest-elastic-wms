import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import Redis from 'ioredis';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../common/cache/redis.constants';

@Injectable()
export class ScannerTelemetryService {
  private readonly logger = new Logger(ScannerTelemetryService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async recordTelemetry(deviceId: string, battery: number, wifiStrength: number, errors: string[]) {
    const key = `scanner:telemetry:${deviceId}`;
    await this.redis.lpush(key, JSON.stringify({
      battery,
      wifiStrength,
      errors,
      ts: Date.now(),
    }));
    await this.redis.ltrim(key, 0, 99);
    await this.redis.expire(key, 86400);
  }

  async validateSeqNum(deviceId: string, seqNum: number): Promise<{ valid: boolean; lastProcessed: number }> {
    if (seqNum <= 0) {
      return { valid: false, lastProcessed: 0 };
    }

    const key = `scanner:seq:${deviceId}`;
    const lastSeq = await this.redis.get(key);
    const lastProcessed = lastSeq ? parseInt(lastSeq, 10) : 0;

    if (seqNum <= lastProcessed) {
      throw new BadRequestException(
        `Out-of-order sequence: ${seqNum} ≤ ${lastProcessed}. Device must re-sync.`,
      );
    }

    const now = Date.now();
    const bufferKey = `scanner:seq:buffer:${deviceId}`;

    if (seqNum > lastProcessed + 1) {
      const gap = seqNum - lastProcessed - 1;
      await this.redis.zadd(bufferKey, now, `${seqNum}`);
      await this.redis.expire(bufferKey, 15);

      if (gap <= 10) {
        await this.redis.setex(key, 10, String(seqNum));
        return { valid: true, lastProcessed: seqNum };
      }

      return { valid: false, lastProcessed };
    }

    await this.redis.setex(key, 10, String(seqNum));
    await this.processBufferedGaps(deviceId, seqNum, key);
    return { valid: true, lastProcessed: seqNum };
  }

  private async processBufferedGaps(deviceId: string, currentSeq: number, key: string): Promise<void> {
    const bufferKey = `scanner:seq:buffer:${deviceId}`;
    const candidates = await this.redis.zrangebyscore(bufferKey, '-inf', '+inf');

    const sorted = candidates.map(Number).sort((a, b) => a - b);
    let lastSeq = currentSeq;

    for (const seq of sorted) {
      if (seq === lastSeq + 1) {
        lastSeq = seq;
        await this.redis.zrem(bufferKey, String(seq));
      }
    }

    if (lastSeq > currentSeq) {
      await this.redis.setex(key, 10, String(lastSeq));
    }
  }

  async getActiveSessionCount(): Promise<number> {
    const keys = await this.redis.keys('scanner:session:*');
    return keys.length;
  }
}
