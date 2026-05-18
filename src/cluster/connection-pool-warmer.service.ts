import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';
import { PrismaService } from '../prisma/prisma.service';

const WARMUP_QUERIES = 50;
const P95_THRESHOLD_MS = 100;

@Injectable()
export class ConnectionPoolWarmerService {
  private readonly logger = new Logger(ConnectionPoolWarmerService.name);
  private warmed = false;
  private warmupStart = 0;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async warmUp(): Promise<void> {
    this.warmupStart = Date.now();
    this.logger.log('Connection pool warm-up started');

    const latencies: number[] = [];
    const queries = Array(WARMUP_QUERIES).fill(null);

    await Promise.all(
      queries.map(async () => {
        const start = Date.now();
        try {
          await this.prisma.$queryRawUnsafe('SELECT 1');
          await this.redis.ping();
        } catch {
          // warmup errors are non-fatal
        }
        latencies.push(Date.now() - start);
      }),
    );

    const sorted = [...latencies].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;

    this.warmed = p95 < P95_THRESHOLD_MS;
    const duration = Date.now() - this.warmupStart;

    this.logger.log(
      `Pool warmed in ${duration}ms: ${latencies.length} queries, ` +
      `avg=${avg.toFixed(1)}ms, p95=${p95}ms, warmed=${this.warmed}`,
    );

    if (!this.warmed) {
      this.logger.warn(`p95 latency ${p95}ms exceeds threshold ${P95_THRESHOLD_MS}ms`);
    }
  }

  isReady(): boolean {
    return this.warmed;
  }

  @Cron('*/30 * * * * *')
  async maintainWarmPool(): Promise<void> {
    if (!this.warmed) return;
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
    } catch {
      this.warmed = false;
    }
  }
}
