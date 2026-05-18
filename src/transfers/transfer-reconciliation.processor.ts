import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Processor('transfer-reconciliation')
export class TransferReconciliationProcessor extends WorkerHost {
  private readonly logger = new Logger(TransferReconciliationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    const { transferId, tenantId } = job.data;
    this.logger.log(`Reconciling transfer ${transferId}`);

    const transfer = await (this.prisma as any).inventoryTransfer.findFirst({
      where: { id: transferId, tenantId },
      include: { lines: true },
    });
    if (!transfer) throw new Error('Transfer not found');

    let totalVariance = 0;
    for (const line of transfer.lines) {
      const variance = Math.abs(line.quantityRequested - line.quantityReceived);
      if (line.quantityRequested > 0) {
        totalVariance += variance / line.quantityRequested;
      }
    }
    const pctVariance = transfer.lines.length > 0 ? (totalVariance / transfer.lines.length) * 100 : 0;

    if (pctVariance > 2) {
      this.eventEmitter.emit('transfer.discrepancy.alert', {
        transferId,
        variancePct: pctVariance.toFixed(2),
        tenantId,
      });
      this.logger.warn(`Transfer ${transferId}: ${pctVariance.toFixed(2)}% variance — supervisor notified`);
    }

    return { transferId, variancePct: pctVariance.toFixed(2) };
  }
}
