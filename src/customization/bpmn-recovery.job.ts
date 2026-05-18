import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BpmnService } from './bpmn.service';

@Processor('bpmn-recovery')
export class BpmnRecoveryJob extends WorkerHost {
  private readonly logger = new Logger(BpmnRecoveryJob.name);

  constructor(private readonly bpmnService: BpmnService) {
    super();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async process(job?: Job) {
    this.logger.log(`BPMN recovery check: ${job?.id || 'cron-triggered'}`);
    const count = await this.bpmnService.recoverSuspended();
    if (count > 0) {
      this.logger.warn(`Suspended ${count} stale BPMN executions`);
    }
  }
}
