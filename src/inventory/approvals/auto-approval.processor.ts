import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('auto-approval-processor')
export class AutoApprovalProcessor extends WorkerHost {
  private readonly logger = new Logger(AutoApprovalProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing auto-approval batch ${job.id}`);
    const pending = await this.prisma.adjustment_approval_requests.findMany({
      where: {
        status: 'PENDING' as any,
        approval_level: 'AUTO_APPROVED' as any,
      },
    });
    for (const req of pending) {
      try {
        await this.prisma.adjustment_approval_requests.update({
          where: { request_id: req.request_id },
          data: { status: 'APPROVED' as any },
        });
        this.eventEmitter.emit('adjustment.auto_approved', {
          tenant_id: req.tenant_id,
          request_id: req.request_id,
          facility_id: req.facility_id,
        });
      } catch (err) {
        this.logger.error(`Failed to auto-approve ${req.request_id}: ${err}`);
      }
    }
    this.logger.log(`Auto-approved ${pending.length} adjustments`);
  }
}
