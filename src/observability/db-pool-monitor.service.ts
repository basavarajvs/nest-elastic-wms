import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WmsMetricsService } from './wms-metrics.service';

@Injectable()
export class DbPoolMonitorService {
  private readonly logger = new Logger(DbPoolMonitorService.name);
  private poolSaturated = false;
  private saturationStart = 0;
  private readonly POOL_LIMIT = parseInt(process.env.DB_POOL_LIMIT || '20', 10);
  private readonly SATURATION_TIMEOUT_MS = 5000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly metrics: WmsMetricsService,
  ) {}

  @Cron('*/10 * * * * *')
  async checkPoolUsage() {
    try {
      const result: Array<{ state: string; count: bigint }> = await this.prisma.$queryRawUnsafe(
        `SELECT state, COUNT(*)::int as count FROM pg_stat_activity WHERE datname = current_database() GROUP BY state`,
      );

      let active = 0;
      let idle = 0;
      let idleInTransaction = 0;

      for (const row of result) {
        const c = Number(row.count);
        this.metrics.activeConnections.set({ state: row.state }, c);
        if (row.state === 'active') active = c;
        else if (row.state === 'idle') idle = c;
        else if (row.state === 'idle in transaction') idleInTransaction = c;
      }

      const totalConnections = Number(result.reduce((acc, r) => acc + Number(r.count), 0));
      const usagePercent = (active / this.POOL_LIMIT) * 100;

      if (usagePercent > 80) {
        this.logger.warn(`DB pool usage critical: ${usagePercent.toFixed(1)}% (${active}/${this.POOL_LIMIT})`);
        this.eventEmitter.emit('db.pool.exhaustion_risk', { active, total: this.POOL_LIMIT, usagePercent });

        if (!this.poolSaturated) {
          this.poolSaturated = true;
          this.saturationStart = Date.now();
        }

        if (usagePercent >= 100 && this.poolSaturated && (Date.now() - this.saturationStart) > this.SATURATION_TIMEOUT_MS) {
          this.eventEmitter.emit('db.pool.saturated', { active, total: this.POOL_LIMIT });
        }
      } else {
        this.poolSaturated = false;
        this.saturationStart = 0;
      }

      this.logger.debug(`DB pool: ${active} active, ${idle} idle, ${idleInTransaction} idle_txn`);
    } catch (err: any) {
      this.logger.error(`DB pool monitor failed: ${err.message}`);
    }
  }

  isSaturated(): boolean {
    return this.poolSaturated && (Date.now() - this.saturationStart) > this.SATURATION_TIMEOUT_MS;
  }
}
