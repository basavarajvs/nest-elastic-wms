import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AdjustmentApprovalService } from './adjustment-approval.service';
import { ApprovalWebController } from './web/approvals.controller';
import { AutoApprovalProcessor } from './auto-approval.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'auto-approval-processor' })],
  controllers: [ApprovalWebController],
  providers: [AdjustmentApprovalService, AutoApprovalProcessor],
  exports: [AdjustmentApprovalService],
})
export class ApprovalsModule {}
