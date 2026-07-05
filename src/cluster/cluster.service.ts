import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { hostname } from 'os';

@Injectable()
export class ClusterService implements OnModuleDestroy {
  private readonly logger = new Logger(ClusterService.name);
  private readonly instanceId: string;
  private readonly subscriptions = new Map<string, Redis>();

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {
    this.instanceId = `${hostname()}-${process.pid}`;
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  async acquireLock(key: string, ttlMs: number): Promise<boolean> {
    const ttlSeconds = Math.ceil(ttlMs / 1000);
    const result = await this.redis.call('SET', key, this.instanceId, 'NX', 'PX', ttlMs);
    return result === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async isLeader(key: string): Promise<boolean> {
    const owner = await this.redis.get(key);
    return owner === this.instanceId;
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.redis.publish(channel, message);
  }

  async subscribe(channel: string, handler: (msg: string) => void): Promise<void> {
    const sub = this.redis.duplicate();
    await sub.subscribe(channel);
    sub.on('message', (_channel: string, message: string) => {
      handler(message);
    });
    this.subscriptions.set(channel, sub);
  }

  async onModuleDestroy(): Promise<void> {
    for (const [channel, sub] of this.subscriptions) {
      try {
        await sub.unsubscribe(channel);
        sub.disconnect();
        this.logger.log(`Unsubscribed from channel ${channel}`);
      } catch (err) {
        this.logger.error(`Error unsubscribing from channel ${channel}: ${(err as Error).message}`);
      }
    }
  }
}
