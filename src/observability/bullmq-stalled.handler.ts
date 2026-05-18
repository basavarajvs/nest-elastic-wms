import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';

const SAFE_IDEMPOTENT_QUEUES = ['wms-notifications', 'integration-inbound-products', 'inventory-alerts'];

@Injectable()
export class BullmqStalledHandler {
  private readonly logger = new Logger(BullmqStalledHandler.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async onStalled(queue: Queue, jobId: string): Promise<void> {
    this.logger.warn(`Job stalled in ${queue.name}: ${jobId}`);

    this.eventEmitter.emit('queue.job.stalled', {
      queueName: queue.name,
      jobId,
      timestamp: new Date().toISOString(),
    });

    if (SAFE_IDEMPOTENT_QUEUES.includes(queue.name)) {
      this.logger.log(`Auto-retrying stalled job ${jobId} from ${queue.name} (idempotent)`);
      try {
        await queue.retryJobs({ count: 1 });
      } catch (err: any) {
        this.logger.error(`Failed to retry stalled job ${jobId}: ${err.message}`);
      }
    } else {
      this.logger.warn(`Moving stalled job ${jobId} to DLQ — stateful queue ${queue.name}`);
      try {
        const job = await queue.getJob(jobId);
        if (job) {
          await job.discard();
          await job.moveToFailed(new Error('STALLED_RECOVERY'), String(job.processedOn || Date.now()), true);
        }
      } catch (err: any) {
        this.logger.error(`Failed to move stalled job ${jobId} to DLQ: ${err.message}`);
      }
    }
  }
}
