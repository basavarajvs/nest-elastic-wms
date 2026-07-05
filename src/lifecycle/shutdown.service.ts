import { Inject, Injectable, Logger, OnApplicationShutdown, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShutdownService implements OnApplicationShutdown {
  private readonly logger = new Logger(ShutdownService.name);
  private isShuttingDown = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @Optional() @InjectQueue('asn-import') private readonly asnImportQueue?: Queue,
    @Optional() @InjectQueue('auto-approval-processor') private readonly autoApprovalQueue?: Queue,
    @Optional() @InjectQueue('workflow-recovery') private readonly workflowRecoveryQueue?: Queue,
    @Optional() @InjectQueue('report-generation') private readonly reportGenerationQueue?: Queue,
    @Optional() @InjectQueue('quota-sync-retry') private readonly quotaSyncRetryQueue?: Queue,
  ) {}

  get shuttingDown(): boolean {
    return this.isShuttingDown;
  }

  async onApplicationShutdown(signal?: string) {
    this.isShuttingDown = true;
    this.logger.warn(`Application shutting down (signal: ${signal})`);

    const timeoutMs =
      this.configService.get<number>('SHUTDOWN_TIMEOUT_MS') || 15000;

    const queues = [
      this.asnImportQueue,
      this.autoApprovalQueue,
      this.workflowRecoveryQueue,
      this.reportGenerationQueue,
      this.quotaSyncRetryQueue,
    ].filter((q): q is Queue => q !== undefined);

    try {
      for (const queue of queues) {
        try {
          await queue.pause();
          this.logger.debug(`Paused queue ${queue.name}`);
        } catch (err) {
          this.logger.error(`Error pausing queue ${queue.name}: ${(err as Error).message}`);
        }
      }
    } catch (err) {
      this.logger.error(`Error during queue pause: ${(err as Error).message}`);
    }

    try {
      for (const queue of queues) {
        try {
          await queue.drain();
          this.logger.debug(`Drained queue ${queue.name}`);
        } catch (err) {
          this.logger.error(`Error draining queue ${queue.name}: ${(err as Error).message}`);
        }
      }
    } catch (err) {
      this.logger.error(`Error during queue drain: ${(err as Error).message}`);
    }

    try {
      for (const queue of queues) {
        try {
          await queue.close();
          this.logger.debug(`Closed queue ${queue.name}`);
        } catch (err) {
          this.logger.error(`Error closing queue ${queue.name}: ${(err as Error).message}`);
        }
      }
    } catch (err) {
      this.logger.error(`Error during queue close: ${(err as Error).message}`);
    }

    try {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    } catch (err) {
      this.logger.error(`Error closing Redis: ${(err as Error).message}`);
    }

    try {
      await this.prisma.$disconnect();
      this.logger.log('Prisma disconnected');
    } catch (err) {
      this.logger.error(`Error disconnecting Prisma: ${(err as Error).message}`);
    }

    this.logger.log(`Waiting ${timeoutMs}ms for active operations to drain...`);
    await new Promise((resolve) => setTimeout(resolve, timeoutMs));

    this.logger.log('Shutdown complete');
  }
}
