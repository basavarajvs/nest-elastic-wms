import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StorageRateService } from './storage-rate.service';

@Injectable()
export class SnapshotService {
  private readonly logger = new Logger(SnapshotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rateService: StorageRateService,
  ) {}

  /** Daily snapshot: runs at 2am via cron */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async generateDailySnapshots() {
    this.logger.log('Starting daily storage inventory snapshot generation');

    const tenants = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT DISTINCT tenant_id FROM multitenant.inventory_on_hand WHERE quantity > 0`
    );

    for (const row of tenants) {
      const tenantId = row.tenant_id;
      try {
        await this.generateSnapshotsForTenant(tenantId);
      } catch (err) {
        this.logger.error(`Snapshot failed for tenant ${tenantId}: ${err}`);
      }
    }
  }

  async generateSnapshotsForTenant(tenantId: string) {
    const onHandRecords = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT ioh.tenant_id, ioh.facility_id, ioh.product_id, ioh.lot_id,
              ioh.location_id, ioh.quantity, ioh.client_id,
              sl.zone_id, wz.zone_type
       FROM multitenant.inventory_on_hand ioh
       LEFT JOIN multitenant.storage_locations sl ON ioh.location_id = sl.location_id
       LEFT JOIN multitenant.warehouse_zones wz ON sl.zone_id = wz.zone_id
       WHERE ioh.tenant_id = $1::uuid AND ioh.quantity > 0`,
      tenantId,
    );

    if (onHandRecords.length === 0) {
      this.logger.log(`No on-hand inventory for tenant ${tenantId}`);
      return;
    }

    const snapshotDate = new Date();
    snapshotDate.setHours(0, 0, 0, 0);
    let created = 0;

    for (const record of onHandRecords) {
      try {
        const clientId = record.client_id;
        const zoneType = record.zone_type || null;

        const rate = await this.rateService.getEffectiveRate(
          tenantId,
          clientId,
          record.product_id,
          zoneType,
        );

        const dailyCharge = rate
          ? Number(rate.rate_per_unit) * Number(record.quantity)
          : 0;

        await this.prisma.$executeRawUnsafe(
          `INSERT INTO multitenant.storage_inventory_snapshots
            (tenant_id, facility_id, cycle_id, snapshot_date, product_id, lot_id,
             location_id, quantity_on_hand, storage_days, storage_rate_id,
             daily_storage_charge, currency_code, created_by)
           VALUES ($1::uuid, $2, 0, $3::date, $4, $5, $6, $7, 1, $8, $9, 'USD', NULL)
           ON CONFLICT (tenant_id, facility_id, cycle_id, snapshot_date, product_id, lot_id, location_id)
           DO UPDATE SET quantity_on_hand = $7, daily_storage_charge = $9`,
          record.tenant_id,
          record.facility_id,
          snapshotDate,
          record.product_id,
          record.lot_id,
          record.location_id,
          record.quantity,
          rate?.rate_id || null,
          dailyCharge,
        );
        created++;
      } catch (err) {
        this.logger.warn(`Snapshot insert skipped for product ${record.product_id}: ${err}`);
      }
    }

    this.logger.log(`Created/updated ${created} snapshots for tenant ${tenantId}`);
  }

  async findSnapshots(tenantId: string, query: any) {
    const { facilityId, cycleId, snapshotDate, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId };
    if (facilityId) where.facility_id = BigInt(facilityId);
    if (cycleId) where.cycle_id = BigInt(cycleId);
    if (snapshotDate) where.snapshot_date = new Date(snapshotDate);
    const [data, total] = await Promise.all([
      this.prisma.storage_inventory_snapshots.findMany({
        where,
        skip,
        take: limit,
        orderBy: { snapshot_date: 'desc' },
      }),
      this.prisma.storage_inventory_snapshots.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async generateOnDemand(tenantId: string, facilityId: bigint) {
    await this.generateSnapshotsForTenant(tenantId);
    return { message: 'Snapshots generated', tenantId };
  }
}
