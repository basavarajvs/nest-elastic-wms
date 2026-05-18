import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';

const SUBSCRIPTIONS = [
  'wms:config:changed',
  'wms:quota:sync',
  'wms:cache:flush',
  'wms:jwt:rotation',
  'wms:migration:completed',
];

@Injectable()
export class RedisPubSubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisPubSubService.name);
  private subscriber: Redis | null = null;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit(): Promise<void> {
    this.subscriber = this.redis.duplicate();
    for (const channel of SUBSCRIPTIONS) {
      await this.subscriber.subscribe(channel);
    }
    this.subscriber.on('message', (channel: string, message: string) => {
      this.logger.debug(`PubSub received: ${channel}`);
      this.eventEmitter.emit(channel, JSON.parse(message));
    });
    this.logger.log(`Redis pub/sub connected: ${SUBSCRIPTIONS.length} channels`);
  }

  async publish(channel: string, payload: Record<string, any>): Promise<void> {
    await this.redis.publish(channel, JSON.stringify(payload));
  }

  async onModuleDestroy(): Promise<void> {
    if (this.subscriber) {
      await this.subscriber.unsubscribe();
      this.subscriber.disconnect();
    }
  }
}
