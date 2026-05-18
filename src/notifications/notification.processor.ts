import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { WmsNotificationClientService } from './wms-notification-client.service';
import type { NotificationDispatchEvent } from './wms-notification.types';

@Processor('wms-notifications', {
  concurrency: 3,
})
@Injectable()
export class WmsNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(WmsNotificationProcessor.name);

  constructor(
    private readonly client: WmsNotificationClientService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === 'dispatch') {
      await this.handleDispatch(job as Job<NotificationDispatchEvent>);
    } else if (job.name === 'audit-dlq') {
      await this.handleAuditDlq(job);
    }
  }

  private async handleDispatch(job: Job<NotificationDispatchEvent>): Promise<void> {
    const data = job.data;
    this.logger.debug(
      `Processing dispatch job ${job.id} for ${data.type} (attempt ${job.attemptsMade + 1})`,
    );

    try {
      const result = await this.client.handleDispatch(data);
      this.logger.log(
        `Dispatched ${data.type} to ${result.recipients} recipients`,
      );
    } catch (err: any) {
      this.logger.error(
        `Dispatch failed for ${data.type} (job ${job.id}): ${err.message}`,
      );
      throw err;
    }
  }

  private async handleAuditDlq(job: Job): Promise<void> {
    this.logger.warn(
      `Processing audit DLQ job ${job.id} for tenant ${job.data.tenantId}`,
    );
  }
}
