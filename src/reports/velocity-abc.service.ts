import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReportParams } from './report.types';
import { createHash } from 'crypto';

interface ShippedQtyRow {
  product_id: string;
  product_code: string;
  product_name: string;
  total_shipped_qty: number;
}

interface DailySnapshotRow {
  product_id: string;
  avg_daily_qty: number;
}

interface CategoryRow {
  product_code: string;
  product_name: string;
  turnover: number;
  velocity_class: string;
}

@Injectable()
export class VelocityAbcService {
  private readonly logger = new Logger(VelocityAbcService.name);
  private readonly CACHE_TTL = 1800;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async *extract(params: ReportParams, tenantId: string): AsyncGenerator<Record<string, any>> {
    const cacheKey = `report:cache:${tenantId}:VELOCITY_ABC:${createHash('sha256').update(JSON.stringify(params)).digest('hex')}`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const rows: Record<string, any>[] = JSON.parse(cached);
        for (const row of rows) {
          yield row;
        }
        return;
      }
    } catch (err) {
      this.logger.warn(`Cache read failed for ${cacheKey}: ${(err as Error).message}`);
    }

    const fromDate = params.dateFrom || '1970-01-01';
    const toDate = params.dateTo || '2999-12-31';
    const facilityId = params.facilityId || '';

    try {
      const shipped: ShippedQtyRow[] = await (this.prisma as any).$queryRawUnsafe(
        `
SELECT
  p.id as product_id,
  p.product_code,
  p.product_name,
  COALESCE(SUM(it.quantity), 0) as total_shipped_qty
FROM multitenant.products p
LEFT JOIN multitenant.inventory_transactions it
  ON it.product_id = p.id
  AND it.tenant_id = $1
  AND it.facility_id = $2
  AND it.transaction_type = 'SHIP'
  AND it.transaction_timestamp >= $3::timestamp
  AND it.transaction_timestamp <= $4::timestamp
WHERE p.tenant_id = $1
GROUP BY p.id, p.product_code, p.product_name
HAVING SUM(it.quantity) > 0
ORDER BY total_shipped_qty DESC`,
        tenantId, facilityId, fromDate, toDate,
      );

      if (!shipped.length) return;

      const productIds = shipped.map(r => r.product_id);

      const snapshots: DailySnapshotRow[] = await (this.prisma as any).$queryRawUnsafe(
        `
SELECT
  sds.product_id,
  COALESCE(AVG(sds.quantity_on_hand), 0) as avg_daily_qty
FROM multitenant.stock_daily_snapshots sds
WHERE sds.tenant_id = $1
  AND sds.facility_id = $2
  AND sds.snapshot_date >= $3::date
  AND sds.snapshot_date <= $4::date
  AND sds.product_id = ANY($5::uuid[])
GROUP BY sds.product_id`,
        tenantId, facilityId, fromDate, toDate, productIds,
      );

      const snapshotMap = new Map<string, number>();
      for (const s of snapshots) {
        snapshotMap.set(s.product_id, s.avg_daily_qty);
      }

      const turnoverData: { product_code: string; product_name: string; turnover: number }[] = [];

      for (const s of shipped) {
        const avgQty = snapshotMap.get(s.product_id) || 0;
        const turnover = avgQty > 0 ? s.total_shipped_qty / avgQty : s.total_shipped_qty;
        turnoverData.push({
          product_code: s.product_code,
          product_name: s.product_name,
          turnover: Math.round(turnover * 100) / 100,
        });
      }

      turnoverData.sort((a, b) => b.turnover - a.turnover);

      const classified = this.classifyABC(turnoverData);

      for (const row of classified) {
        yield row;
      }

      try {
        await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(classified));
      } catch (err) {
        this.logger.warn(`Failed to cache results: ${(err as Error).message}`);
      }

      this.eventEmitter.emit('report.extracted', { type: 'VELOCITY_ABC', tenantId, count: classified.length });
    } catch (err) {
      this.logger.error(`Error computing velocity ABC: ${(err as Error).message}`, (err as Error).stack);
      throw err;
    }
  }

  private classifyABC(data: { product_code: string; product_name: string; turnover: number }[]): Record<string, any>[] {
    const totalTurnover = data.reduce((sum, d) => sum + d.turnover, 0);
    if (totalTurnover === 0) return data.map(d => ({ ...d, velocity_class: 'C', cumulative_pct: 100 }));

    let cumulative = 0;
    return data.map(d => {
      cumulative += d.turnover;
      const cumulativePct = (cumulative / totalTurnover) * 100;
      let velocityClass: string;
      if (cumulativePct <= 80) {
        velocityClass = 'A';
      } else if (cumulativePct <= 95) {
        velocityClass = 'B';
      } else {
        velocityClass = 'C';
      }
      return {
        product_code: d.product_code,
        product_name: d.product_name,
        turnover: d.turnover,
        cumulative_pct: Math.round(cumulativePct * 100) / 100,
        velocity_class: velocityClass,
      };
    });
  }
}
