import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { Queue } from 'bullmq';

const SHUTDOWN_TIMEOUT = parseInt(process.env.SHUTDOWN_TIMEOUT_MS || '15000', 10);
const DRAIN_RF_RETRY_AFTER_MS = 2000;

@Injectable()
export class ShutdownService implements OnApplicationShutdown {
  private readonly logger = new Logger(ShutdownService.name);
  private isShuttingDown = false;
  private isDraining = false;
  private fastifyInstance: FastifyInstance | null = null;
  private queues: Queue[] = [];
  private redis: Redis | null = null;

  constructor(private readonly prisma: PrismaService) {}

  setFastify(instance: FastifyInstance): void {
    this.fastifyInstance = instance;

    // ── Challenge 4: maintenance-proxy for RF endpoints during drain ──
    // Registers onRequest hook that returns 202 Accepted with Retry-After
    // for RF endpoints during graceful shutdown, instead of 503.
    // This lets RF operators complete their current scan and retry transparently.
    instance.addHook('onRequest', async (req: FastifyRequest, reply: FastifyReply) => {
      if (this.isDraining && this.isRfRequest(req.url)) {
        this.logger.debug(`Drain mode — returning 202 for RF request: ${req.url}`);
        return reply.status(202).send({
          status: 'accepted',
          message: 'System is draining — retry in 2s',
          retryAfterMs: DRAIN_RF_RETRY_AFTER_MS,
          sessionId: req.headers['x-session-id'],
        });
      }
    });
  }

  setRedis(redis: Redis): void {
    this.redis = redis;
  }

  registerQueue(queue: Queue): void {
    this.queues.push(queue);
  }

  async gracefulShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    this.isDraining = true;

    this.logger.log(`Graceful shutdown initiated (signal: ${signal}) — RF endpoints remain active during drain`);
    const timeout = setTimeout(() => {
      this.logger.error('Shutdown timeout exceeded, forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT);

    try {
      await this.pauseQueues();
      this.logger.log('BullMQ queues paused');

      this.isDraining = false;
      await this.closeFastify();
      this.logger.log('HTTP server closed');

      await this.prisma.$disconnect();
      this.logger.log('Prisma disconnected');

      if (this.redis) {
        await this.redis.quit();
        this.logger.log('Redis disconnected');
      }

      clearTimeout(timeout);
      process.exit(0);
    } catch (err: any) {
      this.logger.error(`Shutdown error: ${err.message}`);
      clearTimeout(timeout);
      process.exit(1);
    }
  }

  async closeFastify(): Promise<void> {
    if (this.fastifyInstance) {
      try {
        await this.fastifyInstance.close();
      } catch (err: any) {
        this.logger.warn(`Fastify close error: ${err.message}`);
      }
    }
  }

  isRfRequest(url: string): boolean {
    return url?.includes('/rf/') || url?.includes('/scanner/');
  }

  async pauseQueues(): Promise<void> {
    await Promise.all(
      this.queues.map(async (q) => {
        try {
          await q.pause();
        } catch (err: any) {
          this.logger.warn(`Failed to pause queue ${q.name}: ${err.message}`);
        }
      }),
    );

    const drainTimeout = 10000;
    const start = Date.now();
    while (Date.now() - start < drainTimeout) {
      const active = await Promise.all(this.queues.map((q) => q.getActiveCount()));
      const total = active.reduce((a, b) => a + b, 0);
      if (total === 0) break;
      await new Promise((r) => setTimeout(r, 200));
    }

    this.logger.log('Active jobs drained');
  }

  isShutdown(): boolean {
    return this.isShuttingDown;
  }

  isDrainMode(): boolean {
    return this.isDraining;
  }

  onApplicationShutdown(signal?: string) {
    this.logger.log(`Application shutdown hook: ${signal}`);
  }
}
