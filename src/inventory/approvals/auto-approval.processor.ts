import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';

@Processor('auto-approval-processor')
export class AutoApprovalProcessor extends WorkerHost {
  private readonly logger = new Logger(AutoApprovalProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
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
        await this.auditService.log({
          tenantId: req.tenant_id,
          action: 'AUTO_APPROVE_ADJUSTMENT',
          tableName: 'adjustment_approval_requests',
          recordId: String(req.request_id),
          notes: 'Auto-approved below threshold',
        });
      } catch (err) {
        this.logger.error(`Failed to auto-approve ${req.request_id}: ${err}`);
      }
    }
    this.logger.log(`Auto-approved ${pending.length} adjustments`);
  }
}
