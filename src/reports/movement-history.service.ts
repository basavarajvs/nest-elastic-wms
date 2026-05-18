import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReportParams } from './report.types';
import { createHash } from 'crypto';

interface MovementRow {
  id: string;
  timestamp: Date;
  type: string;
  reference_doc: string;
  product_code: string;
  product_name: string;
  lot_number: string | null;
  location_from: string | null;
  location_to: string | null;
  quantity: number;
  uom_code: string;
  performed_by: string;
}

@Injectable()
export class MovementHistoryService {
  private readonly logger = new Logger(MovementHistoryService.name);
  private readonly CACHE_TTL = 300;
  private readonly PAGE_SIZE = 1000;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async *extract(params: ReportParams, tenantId: string): AsyncGenerator<Record<string, any>> {
    const cacheKey = `report:cache:${tenantId}:MOVEMENT_HISTORY:${createHash('sha256').update(JSON.stringify(params)).digest('hex')}`;

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
    const fromDate = params.dateFrom || '1970-01-01';
    const toDate = params.dateTo || '2999-12-31';
    let lastId = '';

    for (;;) {
      try {
        const sql = this.buildQuery(params, lastId);
        const queryParams = this.buildQueryParams(params, tenantId, fromDate, toDate, lastId);
        const batch: MovementRow[] = await (this.prisma as any).$queryRawUnsafe(sql, ...queryParams);

        if (!batch.length) break;

        for (const row of batch) {
          allRows.push(row);
          yield row;
        }

        lastId = batch[batch.length - 1].id;

        if (batch.length < this.PAGE_SIZE) break;
      } catch (err) {
        this.logger.error(`Error fetching movement history page: ${(err as Error).message}`, (err as Error).stack);
        throw err;
      }
    }

    try {
      await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(allRows));
    } catch (err) {
      this.logger.warn(`Failed to cache results: ${(err as Error).message}`);
    }

    this.eventEmitter.emit('report.extracted', { type: 'MOVEMENT_HISTORY', tenantId, count: allRows.length });
  }

  private buildQueryParams(params: ReportParams, tenantId: string, fromDate: string, toDate: string, lastId: string): any[] {
    const p: any[] = [tenantId, fromDate, toDate, params.facilityId || ''];
    if (lastId) p.push(lastId);
    return p;
  }

  private buildQuery(params: ReportParams, lastId: string): string {
    const conditions: string[] = [
      'it.tenant_id = $1',
      'it.transaction_timestamp >= $2::timestamp',
      'it.transaction_timestamp <= $3::timestamp',
      'it.facility_id = $4',
    ];
    let idx = 5;

    if (lastId) {
      conditions.push(`it.id > $${idx++}::uuid`);
    }

    return `
SELECT
  it.id,
  it.transaction_timestamp as timestamp,
  it.transaction_type as type,
  COALESCE(it.reference_number, '') as reference_doc,
  p.product_code,
  p.product_name,
  COALESCE(l.lot_number, '') as lot_number,
  COALESCE(loc_from.location_code, '') as location_from,
  COALESCE(loc_to.location_code, '') as location_to,
  it.quantity,
  u.uom_code,
  COALESCE(it.created_by, 'SYSTEM') as performed_by
FROM multitenant.inventory_transactions it
JOIN multitenant.products p ON p.id = it.product_id AND p.tenant_id = $1
LEFT JOIN multitenant.storage_locations loc_from ON loc_from.id = it.from_location_id
LEFT JOIN multitenant.storage_locations loc_to ON loc_to.id = it.to_location_id
LEFT JOIN multitenant.inventory_lots l ON l.id = it.lot_id
JOIN multitenant.units_of_measure u ON u.id = it.uom_id
WHERE ${conditions.join('\n  AND ')}
ORDER BY it.id
LIMIT ${this.PAGE_SIZE}`;
  }
}
