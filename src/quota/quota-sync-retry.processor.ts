import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QuotaInitService } from './quota-init.service';

export const QUOTA_SYNC_QUEUE = 'quota-sync-retry';

@Processor(QUOTA_SYNC_QUEUE)
export class QuotaSyncRetryProcessor extends WorkerHost {
  private readonly logger = new Logger(QuotaSyncRetryProcessor.name);

  constructor(private readonly quotaInit: QuotaInitService) {
    super();
  }

  async process(job: Job<{ tenantId: string }>): Promise<void> {
    try {
      await this.quotaInit.syncQuotasFromCore(job.data.tenantId);
      this.logger.log(`Quota sync succeeded for tenant ${job.data.tenantId}`);
    } catch (err: any) {
      this.logger.warn(
        `Quota sync failed for tenant ${job.data.tenantId} (attempt ${job.attemptsMade + 1}): ${err.message}`,
      );
      throw err; // BullMQ will retry with backoff
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(
      `Quota sync job ${job.id} failed after ${job.attemptsMade} attempts: ${err.message}`,
    );
  }
}
