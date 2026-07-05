import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QuotaInitService } from './quota-init.service';
import { QUOTA_SYNC_QUEUE } from './quota-sync.constants';

@Processor(QUOTA_SYNC_QUEUE)
export class QuotaSyncRetryProcessor extends WorkerHost {
  private readonly logger = new Logger(QuotaSyncRetryProcessor.name);

  constructor(private readonly quotaInit: QuotaInitService) {
    super();
  }

  async process(job: Job<{ tenantId: string }>): Promise<void> {
    const { tenantId } = job.data;
    this.logger.log(`Retrying quota sync for tenant ${tenantId}`);

    try {
      await this.quotaInit.syncQuotasForTenant(tenantId);
      this.logger.log(`Quota sync retry succeeded for tenant ${tenantId}`);
    } catch (err) {
      this.logger.error(`Quota sync retry failed for tenant ${tenantId}: ${(err as Error).message}`);
      throw err;
    }
  }
}
