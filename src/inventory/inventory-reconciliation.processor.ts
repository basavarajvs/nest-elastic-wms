import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InventoryReconciliationService } from './inventory-reconciliation.service';

@Processor('inventory-reconciliation')
export class InventoryReconciliationProcessor extends WorkerHost {
  private readonly logger = new Logger(InventoryReconciliationProcessor.name);

  constructor(
    private readonly reconciliationService: InventoryReconciliationService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing inventory reconciliation job: ${job.id}`);
    await this.reconciliationService.runDailyReconciliation();
  }
}
