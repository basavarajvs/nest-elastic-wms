import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';

interface InventoryRow {
  product_id: string;
  facility_id: string;
  qty_on_hand: number;
  qty_allocated: number;
}

interface TenantRow {
  tenant_id: string;
}

interface AvgRow {
  avg_qty: number | null;
}

@Injectable()
export class StockDailySnapshotService implements OnModuleInit {
  private readonly logger = new Logger(StockDailySnapshotService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async onModuleInit() {
    await this.ensureSnapshotTable();
  }

  async ensureSnapshotTable(): Promise<void> {
    await (this.prisma as any).$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS multitenant.stock_daily_snapshots (
        id UUID DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        product_id UUID NOT NULL,
        facility_id UUID NOT NULL,
        snapshot_date DATE NOT NULL,
        qty_on_hand DECIMAL(15,4) DEFAULT 0,
        qty_allocated DECIMAL(15,4) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (id),
        UNIQUE (tenant_id, product_id, facility_id, snapshot_date)
      );
    `);
    await (this.prisma as any).$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_sds_lookup
      ON multitenant.stock_daily_snapshots (tenant_id, product_id, facility_id, snapshot_date);
    `);
    this.logger.log('Ensured stock_daily_snapshots table exists');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async takeSnapshot(): Promise<void> {
    this.logger.log('Starting daily stock snapshot...');

    const tenants: TenantRow[] = await (this.prisma as any).$queryRawUnsafe(
      'SELECT DISTINCT tenant_id FROM multitenant.inventory_on_hand',
    );

    let totalSnapshots = 0;

    for (const tenant of tenants) {
      const tenantId = tenant.tenant_id;

      const rows: InventoryRow[] = await (this.prisma as any).$queryRawUnsafe(
        `SELECT product_id, facility_id, SUM(quantity_on_hand) as qty_on_hand, SUM(quantity_allocated) as qty_allocated
         FROM multitenant.inventory_on_hand
         WHERE tenant_id = $1
         GROUP BY product_id, facility_id`,
        tenantId,
      );

      for (const row of rows) {
        await (this.prisma as any).$executeRawUnsafe(
          `INSERT INTO multitenant.stock_daily_snapshots (tenant_id, product_id, facility_id, snapshot_date, qty_on_hand, qty_allocated, created_at)
           VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, NOW())
           ON CONFLICT (tenant_id, product_id, facility_id, snapshot_date)
           DO UPDATE SET qty_on_hand = EXCLUDED.qty_on_hand, qty_allocated = EXCLUDED.qty_allocated, created_at = NOW()`,
          tenantId,
          row.product_id,
          row.facility_id,
          row.qty_on_hand,
          row.qty_allocated,
        );
      }

      totalSnapshots += rows.length;
    }

    const dateKey = new Date().toISOString().slice(0, 10);
    await this.redis.hincrby(`wms:metrics:snapshots:${dateKey}`, 'count', totalSnapshots);

    this.logger.log(`Stock snapshot complete: ${totalSnapshots} records inserted`);
  }

  async getTwai(
    productId: string,
    facilityId: string,
    tenantId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<number> {
    const result: AvgRow[] = await (this.prisma as any).$queryRawUnsafe(
      `SELECT AVG(qty_on_hand) as avg_qty
       FROM multitenant.stock_daily_snapshots
       WHERE tenant_id = $1 AND product_id = $2 AND facility_id = $3
         AND snapshot_date BETWEEN $4 AND $5`,
      tenantId,
      productId,
      facilityId,
      dateFrom,
      dateTo,
    );

    return result[0]?.avg_qty ?? 0;
  }
}
