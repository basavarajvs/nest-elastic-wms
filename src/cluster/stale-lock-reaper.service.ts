import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';

const HEARTBEAT_PREFIX = 'bullmq:job:heartbeat:';
const STALE_LOCK_MULTIPLIER = 1.5;

@Injectable()
export class StaleLockReaperService {
  private readonly logger = new Logger(StaleLockReaperService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async renewHeartbeat(jobId: string, lockDurationMs: number = 30000): Promise<void> {
    const key = `${HEARTBEAT_PREFIX}${jobId}`;
    await this.redis.set(key, Date.now().toString(), 'PX', Math.ceil(lockDurationMs * STALE_LOCK_MULTIPLIER));
  }

  @Cron('*/15 * * * * *')
  async reapStaleLocks(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${HEARTBEAT_PREFIX}*`);
      for (const key of keys) {
        const heartbeat = await this.redis.get(key);
        if (!heartbeat) continue;

        const age = Date.now() - parseInt(heartbeat, 10);
        if (age > 45000) {
          const jobId = key.replace(HEARTBEAT_PREFIX, '');
          this.logger.warn(`Releasing stale lock for job ${jobId} (age: ${age}ms)`);
          await this.redis.del(key);
          await this.redis.del(`bullmq:${jobId}:lock`);
          this.eventEmitter.emit('cluster.stale_lock.released', { jobId, age });
        }
      }
    } catch (err: any) {
      this.logger.error(`Stale lock reaper failed: ${err.message}`);
    }
  }
}
