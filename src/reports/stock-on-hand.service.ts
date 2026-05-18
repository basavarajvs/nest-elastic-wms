import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReportParams } from './report.types';
import { createHash } from 'crypto';

interface StockOnHandRow {
  product_code: string;
  product_name: string;
  velocity_class: string;
  location_code: string;
  zone_code: string;
  location_type: string;
  lot_number: string | null;
  expiry_date: Date | null;
  uom_code: string;
  on_hand: number;
  allocated: number;
  reserved: number;
  available: number;
}

@Injectable()
export class StockOnHandService {
  private readonly logger = new Logger(StockOnHandService.name);
  private readonly CACHE_TTL = 300;
  private readonly PAGE_SIZE = 2000;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async *extract(params: ReportParams, tenantId: string): AsyncGenerator<Record<string, any>> {
    const cacheKey = `report:cache:${tenantId}:STOCK_ON_HAND:${createHash('sha256').update(JSON.stringify(params)).digest('hex')}`;

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

    const allRows: Record<string, any>[] = [];
    let lastLocationCode = '';
    let lastProductCode = '';

    for (;;) {
      try {
        const sql = this.buildQuery(params, lastLocationCode, lastProductCode);
        const queryParams = this.buildQueryParams(params, tenantId, lastLocationCode, lastProductCode);
        const batch: StockOnHandRow[] = await (this.prisma as any).$queryRawUnsafe(sql, ...queryParams);

        if (!batch.length) break;

        for (const row of batch) {
          allRows.push(row);
          yield row;
        }

        const last = batch[batch.length - 1];
        lastLocationCode = last.location_code;
        lastProductCode = last.product_code;

        if (batch.length < this.PAGE_SIZE) break;
      } catch (err) {
        this.logger.error(`Error fetching stock on hand page: ${(err as Error).message}`, (err as Error).stack);
        throw err;
      }
    }

    try {
      await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(allRows));
    } catch (err) {
      this.logger.warn(`Failed to cache results: ${(err as Error).message}`);
    }

    this.eventEmitter.emit('report.extracted', { type: 'STOCK_ON_HAND', tenantId, count: allRows.length });
  }

  private buildQueryParams(params: ReportParams, tenantId: string, lastLocationCode: string, lastProductCode: string): any[] {
    const p: any[] = [tenantId, params.facilityId || ''];
    if (params.zoneId) p.push(params.zoneId);
    if (params.productClass) p.push(params.productClass);
    if (lastLocationCode && lastProductCode) {
      p.push(lastLocationCode, lastProductCode);
    }
    return p;
  }

  private buildQuery(params: ReportParams, lastLocationCode: string, lastProductCode: string): string {
    const conditions: string[] = [
      'p.tenant_id = $1',
      'loc.facility_id = $2',
      'loc.is_active = true',
    ];
    let idx = 3;

    if (params.zoneId) {
      conditions.push(`z.id = $${idx++}`);
    }
    if (params.productClass) {
      conditions.push(`p.velocity_class = $${idx++}`);
    }
    if (lastLocationCode && lastProductCode) {
      conditions.push(`(loc.location_code, p.product_code) > ($${idx++}, $${idx++})`);
    }

    return `
SELECT
  p.product_code, p.product_name, p.velocity_class,
  loc.location_code, z.zone_code, loc.location_type,
  l.lot_number, l.expiry_date,
  u.uom_code,
  SUM(ioh.quantity_on_hand) as on_hand,
  SUM(ioh.quantity_allocated) as allocated,
  SUM(ioh.quantity_reserved) as reserved,
  (SUM(ioh.quantity_on_hand) - SUM(ioh.quantity_allocated) - SUM(ioh.quantity_reserved)) as available
FROM multitenant.inventory_on_hand ioh
JOIN multitenant.products p ON p.id = ioh.product_id AND p.tenant_id = $1
JOIN multitenant.storage_locations loc ON loc.id = ioh.location_id AND loc.tenant_id = $1
JOIN multitenant.warehouse_zones z ON z.id = loc.zone_id AND z.tenant_id = $1
LEFT JOIN multitenant.inventory_lots l ON l.id = ioh.lot_id
JOIN multitenant.units_of_measure u ON u.id = ioh.uom_id
WHERE ${conditions.join('\n  AND ')}
GROUP BY p.id, loc.id, l.id, u.id
ORDER BY loc.location_code, p.product_code
LIMIT ${this.PAGE_SIZE}`;
  }
}
