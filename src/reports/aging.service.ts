import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReportParams } from './report.types';
import { createHash } from 'crypto';

interface AgingRow {
  product_code: string;
  product_name: string;
  lot_number: string | null;
  received_date: Date | null;
  days_aged: number;
  age_bucket: string;
  qty_on_hand: number;
  expiry_date: Date | null;
  expiry_status: string;
}

@Injectable()
export class AgingService {
  private readonly logger = new Logger(AgingService.name);
  private readonly CACHE_TTL = 1800;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async *extract(params: ReportParams, tenantId: string): AsyncGenerator<Record<string, any>> {
    const cacheKey = `report:cache:${tenantId}:AGING_ANALYSIS:${createHash('sha256').update(JSON.stringify(params)).digest('hex')}`;

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

    try {
      const thresholdDays = params.thresholdDays ?? 90;
      const facilityId = params.facilityId || '';

      const sql = `
SELECT
  p.product_code,
  p.product_name,
  l.lot_number,
  l.received_date,
  COALESCE(EXTRACT(DAY FROM (CURRENT_DATE - l.received_date)), 0)::int as days_aged,
  CASE
    WHEN COALESCE(EXTRACT(DAY FROM (CURRENT_DATE - l.received_date)), 0) <= 30 THEN '0-30'
    WHEN COALESCE(EXTRACT(DAY FROM (CURRENT_DATE - l.received_date)), 0) <= 60 THEN '31-60'
    WHEN COALESCE(EXTRACT(DAY FROM (CURRENT_DATE - l.received_date)), 0) <= 90 THEN '61-90'
    WHEN COALESCE(EXTRACT(DAY FROM (CURRENT_DATE - l.received_date)), 0) <= 180 THEN '91-180'
    WHEN COALESCE(EXTRACT(DAY FROM (CURRENT_DATE - l.received_date)), 0) <= 365 THEN '181-365'
    ELSE '365+'
  END as age_bucket,
  SUM(ioh.quantity_on_hand) as qty_on_hand,
  l.expiry_date,
  CASE
    WHEN l.expiry_date IS NULL THEN 'NO_EXPIRY'
    WHEN l.expiry_date - CURRENT_DATE <= $3::int THEN 'NEAR_EXPIRY'
    WHEN l.expiry_date < CURRENT_DATE THEN 'EXPIRED'
    ELSE 'VALID'
  END as expiry_status
FROM multitenant.inventory_on_hand ioh
JOIN multitenant.products p ON p.id = ioh.product_id AND p.tenant_id = $1
JOIN multitenant.inventory_lots l ON l.id = ioh.lot_id
WHERE p.tenant_id = $1
  AND ioh.facility_id = $2
  AND ioh.quantity_on_hand > 0
GROUP BY p.id, l.id
ORDER BY l.received_date ASC NULLS LAST`;

      const rows: AgingRow[] = await (this.prisma as any).$queryRawUnsafe(sql, tenantId, facilityId, thresholdDays);
      const result: Record<string, any>[] = rows.map(r => ({ ...r }));

      for (const row of result) {
        yield row;
      }

      try {
        await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
      } catch (err) {
        this.logger.warn(`Failed to cache results: ${(err as Error).message}`);
      }

      this.eventEmitter.emit('report.extracted', { type: 'AGING_ANALYSIS', tenantId, count: result.length });
    } catch (err) {
      this.logger.error(`Error fetching aging data: ${(err as Error).message}`, (err as Error).stack);
      throw err;
    }
  }
}
