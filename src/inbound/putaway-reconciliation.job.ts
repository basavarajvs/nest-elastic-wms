import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PutawayReconciliationJob {
  private readonly logger = new Logger(PutawayReconciliationJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async runReconciliation(): Promise<void> {
    this.logger.log('Starting putaway/inventory reconciliation...');

    const phantomLpns = await (this.prisma as any).$queryRawUnsafe(`
      SELECT
        lp.id,
        lp.lpn_number,
        lp.tenant_id,
        lp.facility_id,
        lp.product_id,
        lp.location_id,
        lp.quantity,
        lp.uom_id,
        lp.lot_number
      FROM multitenant.license_plate_numbers lp
      WHERE lp.status = 'STORED'
        AND NOT EXISTS (
          SELECT 1 FROM multitenant.inventory_on_hand ioh
          WHERE ioh.tenant_id = lp.tenant_id
            AND ioh.facility_id = lp.facility_id
            AND ioh.location_id = lp.location_id
            AND ioh.product_id = lp.product_id
            AND ioh.quantity_on_hand >= 0
        )
    `);

    if (!Array.isArray(phantomLpns) || phantomLpns.length === 0) {
      this.logger.log('No phantom LPNs detected');
      return;
    }

    this.logger.warn(`Detected ${phantomLpns.length} phantom LPNs with missing InventoryOnHand records`);

    for (const lpn of phantomLpns) {
      try {
        await (this.prisma as any).$transaction(async (tx: any) => {
          const lot = lpn.lot_number
            ? await tx.inventoryLot.findFirst({ where: { lotNumber: lpn.lot_number, tenantId: lpn.tenant_id, facilityId: lpn.facility_id, productId: lpn.product_id } })
            : null;
          const lotId = lot?.id || '00000000-0000-0000-0000-000000000000';

          await tx.inventoryOnHand.create({
            data: {
              tenantId: lpn.tenant_id,
              facilityId: lpn.facility_id,
              productId: lpn.product_id,
              locationId: lpn.location_id,
              lotId,
              quantityOnHand: lpn.quantity,
              uomId: lpn.uom_id,
            },
          });

          await tx.inventoryTransaction.create({
            data: {
              tenantId: lpn.tenant_id,
              facilityId: lpn.facility_id,
              productId: lpn.product_id,
              locationId: lpn.location_id,
              lotId,
              transactionType: 'SYSTEM_CORRECTION' as any,
              transactionStatus: 'COMPLETED',
              quantity: lpn.quantity,
              quantityBefore: 0,
              quantityAfter: lpn.quantity,
              uomId: lpn.uom_id,
              referenceType: 'SYSTEM_CORRECTION',
              referenceId: lpn.id,
              reasonCode: 'PUTAWAY_RECONCILIATION',
            },
          });
        });
        this.logger.log(`Corrected inventory for LPN ${lpn.lpn_number}`);
      } catch (err: any) {
        this.logger.error(`Failed to correct LPN ${lpn.lpn_number}: ${err.message}`);
      }
    }

    this.eventEmitter.emit('inventory.drift.detected', {
      type: 'PUTAWAY_RECONCILIATION',
      totalCorrected: phantomLpns.length,
      details: phantomLpns.map((lpn: any) => ({ lpnNumber: lpn.lpn_number, tenantId: lpn.tenant_id })),
      timestamp: new Date(),
    });

    this.logger.warn(`${phantomLpns.length} corrections applied. Supervisor notification sent via event.`);
  }
}
