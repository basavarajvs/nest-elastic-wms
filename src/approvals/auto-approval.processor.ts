import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AdjustmentApprovalService } from '../approvals/adjustment-approval.service';

@Processor('auto-approval-processor')
export class AutoApprovalProcessor extends WorkerHost {
  private readonly logger = new Logger(AutoApprovalProcessor.name);

  constructor(private readonly approvalService: AdjustmentApprovalService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log('Running auto-approval processor...');
    await this.approvalService.autoApprove();
    return { autoApproved: true };
  }
}
