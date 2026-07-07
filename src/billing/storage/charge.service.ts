import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ChargeService {
  private readonly logger = new Logger(ChargeService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Calculate charges from snapshots: runs after snapshots at 2:30am */
  @Cron('30 2 * * *')
  async calculateChargesFromSnapshots() {
    this.logger.log('Starting charge calculation from snapshots');

    const tenants = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT DISTINCT tenant_id FROM multitenant.storage_inventory_snapshots
       WHERE daily_storage_charge IS NOT NULL AND daily_storage_charge > 0`
    );

    for (const row of tenants) {
      const tenantId = row.tenant_id;
      try {
        await this.calculateCharges(tenantId);
      } catch (err) {
        this.logger.error(`Charge calculation failed for tenant ${tenantId}: ${err}`);
      }
    }
  }

  async calculateCharges(tenantId: string) {
    const snapshots = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT sis.*, ioh.client_id
       FROM multitenant.storage_inventory_snapshots sis
       LEFT JOIN multitenant.inventory_on_hand ioh
         ON sis.product_id = ioh.product_id
        AND sis.location_id = ioh.location_id
        AND sis.lot_id IS NOT DISTINCT FROM ioh.lot_id
        AND sis.tenant_id = ioh.tenant_id
       WHERE sis.tenant_id = $1::uuid AND sis.daily_storage_charge > 0`,
      tenantId,
    );

    let chargesCreated = 0;
    for (const snap of snapshots) {
      try {
        const chargeAmount = Number(snap.daily_storage_charge) * Number(snap.storage_days || 1);
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO multitenant.storage_charges
            (tenant_id, owner_client_id, product_id, lot_id,
             storage_start_date, storage_end_date, days_in_storage,
             volume_stored, unit_type, applicable_rate, charge_amount, currency)
           VALUES ($1::uuid, $2, $3, $4, $5::date, $5::date, $6,
                   $7, 'PALLET', $8, $9, 'USD')`,
          tenantId,
          snap.client_id || 0,
          snap.product_id,
          snap.lot_id,
          snap.snapshot_date,
          snap.storage_days || 1,
          Number(snap.quantity_on_hand),
          Number(snap.daily_storage_charge),
          chargeAmount,
        );
        chargesCreated++;
      } catch (err) {
        this.logger.warn(`Charge insert skipped: ${err}`);
      }
    }
    this.logger.log(`Created ${chargesCreated} charges for tenant ${tenantId}`);
  }

  async findAll(tenantId: string, query: any) {
    const { clientId, billingCycleId } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId };
    if (clientId) where.owner_client_id = BigInt(clientId);
    if (billingCycleId) where.billing_cycle_id = BigInt(billingCycleId);
    const [data, total] = await Promise.all([
      this.prisma.storage_charges.findMany({
        where,
        skip,
        take: limit,
        orderBy: { storage_start_date: 'desc' },
        include: { clients: true, products: true, inventory_lots: true },
      }),
      this.prisma.storage_charges.count({ where }),
    ]);
    return {
      data: data.map((d: any) => ({
        ...d,
        client_name: d.clients?.client_name ?? null,
        product_name: d.products?.product_name ?? null,
        lot_number: d.inventory_lots?.lot_number ?? null,
      })),
      total,
      page,
      limit,
    };
  }
}
