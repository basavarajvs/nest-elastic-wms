import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Processor('reconcile-allocations')
export class ReconcileAllocationsProcessor extends WorkerHost {
  private readonly logger = new Logger(ReconcileAllocationsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runReconciliation(): Promise<void> {
    this.logger.log('Starting allocation reconciliation...');

    const expiredAllocs = await (this.prisma as any).inventoryAllocation.findMany({
      where: {
        status: 'SOFT',
        expiresAt: { lte: new Date() },
      },
    });

    if (expiredAllocs.length === 0) {
      this.logger.log('No expired allocations to reconcile');
      return;
    }

    this.logger.warn(`Found ${expiredAllocs.length} expired SOFT allocations`);

    for (const alloc of expiredAllocs) {
      try {
        await (this.prisma as any).$transaction(async (tx: any) => {
          await tx.inventoryAllocation.update({
            where: { id: alloc.id },
            data: { status: 'CANCELLED' },
          });

          await tx.inventoryOnHand.updateMany({
            where: {
              tenantId: alloc.tenantId,
              locationId: alloc.locationId,
              productId: alloc.productId,
            },
            data: { quantityAllocated: { decrement: alloc.quantityAllocated } },
          });

          await tx.inventoryTransaction.create({
            data: {
              tenantId: alloc.tenantId,
              facilityId: alloc.facilityId,
              productId: alloc.productId,
              locationId: alloc.locationId,
              lotId: alloc.lotId,
              transactionType: 'ADJUSTMENT_INCREASE',
              transactionStatus: 'COMPLETED',
              quantity: alloc.quantityAllocated,
              quantityBefore: 0,
              quantityAfter: 0,
              uomId: alloc.uomId,
              referenceType: 'ALLOCATION_EXPIRED',
              referenceId: alloc.id,
              reasonCode: 'ALLOCATION_EXPIRY_RELEASE',
            },
          });
        });

        this.eventEmitter.emit('allocation.expired', {
          allocationId: alloc.id,
          productId: alloc.productId,
          quantity: alloc.quantityAllocated,
          tenantId: alloc.tenantId,
        });
      } catch (err: any) {
        this.logger.error(`Failed to release allocation ${alloc.id}: ${err.message}`);
      }
    }

    this.logger.log(`Reconciled ${expiredAllocs.length} expired allocations`);
  }

  async process(job: Job): Promise<any> {
    if (job.name === 'trigger-reconciliation') {
      await this.runReconciliation();
      return { reconciled: true };
    }
    return { skipped: true };
  }
}
