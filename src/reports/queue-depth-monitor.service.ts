import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';

@Injectable()
export class QueueDepthMonitorService {
  private readonly logger = new Logger(QueueDepthMonitorService.name);

  constructor(
    @InjectQueue('wms-reports') private readonly reportsQueue: Queue,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async isOverloaded(): Promise<boolean> {
    const activeCount = await this.reportsQueue.getActiveCount();
    return activeCount > 6;
  }

  async getQueueDepth(): Promise<{
    waiting: number;
    active: number;
    delayed: number;
    failed: number;
  }> {
    const [waiting, active, delayed, failed] = await Promise.all([
      this.reportsQueue.getWaitingCount(),
      this.reportsQueue.getActiveCount(),
      this.reportsQueue.getDelayedCount(),
      this.reportsQueue.getFailedCount(),
    ]);

    return { waiting, active, delayed, failed };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async monitorQueueDepth(): Promise<void> {
    const depth = await this.getQueueDepth();

    if (depth.active > 6) {
      this.logger.warn(
        `Queue wms-reports is overloaded: active=${depth.active} waiting=${depth.waiting} delayed=${depth.delayed} failed=${depth.failed}`,
      );
    }

    const currentMax = await this.redis.get('wms:metrics:reports:max_depth');
    const maxDepth = currentMax ? parseInt(currentMax, 10) : 0;

    if (depth.active > maxDepth) {
      await this.redis.set('wms:metrics:reports:max_depth', depth.active);
    }
  }
}
