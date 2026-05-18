import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryReconciliationService {
  private readonly logger = new Logger(InventoryReconciliationService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async runDailyReconciliation(): Promise<void> {
    this.logger.log('Starting daily inventory reconciliation...');

    const drifts = await (this.prisma as any).$queryRawUnsafe(`
      SELECT
        ioh.tenant_id,
        ioh.facility_id,
        ioh.id as on_hand_id,
        ioh.product_id,
        ioh.location_id,
        ioh.lot_id,
        ioh.quantity_on_hand,
        COALESCE(txn.total, 0) as computed_balance
      FROM multitenant.inventory_on_hand ioh
      LEFT JOIN (
        SELECT
          it.tenant_id,
          it.facility_id,
          it.product_id,
          it.location_id,
          it.lot_id,
          COALESCE(SUM(
            CASE
              WHEN it.transaction_type IN ('RECEIPT','PUTAWAY','TRANSFER_IN','ADJUSTMENT_INCREASE','QC_PASS')
              THEN it.quantity
              ELSE -it.quantity
            END
          ), 0) as total
        FROM multitenant.inventory_transactions it
        GROUP BY it.tenant_id, it.facility_id, it.product_id, it.location_id, it.lot_id
      ) txn ON txn.tenant_id = ioh.tenant_id
        AND txn.facility_id = ioh.facility_id
        AND txn.product_id = ioh.product_id
        AND txn.location_id = ioh.location_id
        AND txn.lot_id = ioh.lot_id
      WHERE ABS(ioh.quantity_on_hand - COALESCE(txn.total, 0)) > 0.001
        AND ABS(ioh.quantity_on_hand - COALESCE(txn.total, 0)) / NULLIF(ioh.quantity_on_hand, 0) > 0.001
    `);

    if (Array.isArray(drifts) && drifts.length > 0) {
      this.logger.warn(`Detected ${drifts.length} inventory drifts exceeding 0.1% variance`);
      for (const drift of drifts) {
        this.logger.warn(
          `Drift: product=${drift.product_id} onHand=${drift.quantity_on_hand} computed=${drift.computed_balance}`,
        );
      }
    } else {
      this.logger.log('No inventory drifts detected');
    }
  }
}
