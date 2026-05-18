import { Injectable, Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../common/cache/redis.constants';
import Redis from 'ioredis';
import * as os from 'os';

@Injectable()
export class ReportLockService {
  private readonly workerId: string;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    this.workerId = `${os.hostname()}-${process.pid}`;
  }

  async acquire(jobId: string, ttlSeconds: number): Promise<boolean> {
    const key = `report:lock:${jobId}`;
    const result = await (this.redis as any).set(key, this.workerId, 'NX', 'EX', ttlSeconds);
    return result === 'OK';
  }

  async release(jobId: string): Promise<void> {
    const key = `report:lock:${jobId}`;
    await this.redis.del(key);
  }

  async isLocked(jobId: string): Promise<boolean> {
    const key = `report:lock:${jobId}`;
    const exists = await this.redis.exists(key);
    return exists === 1;
  }
}
