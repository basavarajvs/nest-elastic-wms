import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { OutboundModule } from '../outbound/outbound.module';
import { SecurityModule } from '../security/security.module';
import { OnHandService } from './on-hand/on-hand.service';
import { LpnService } from './lpn/lpn.service';
import { LotService } from './lots/lot.service';
import { TransactionService } from './transactions/transaction.service';
import { HoldService } from './holds/hold.service';
import { AdjustmentService } from './adjustments/adjustment.service';
import { CycleCountService } from './counts/cycle-count.service';
import { AllocationService } from './allocations/allocation.service';
import { ApprovalThresholdService } from './approvals/approval-threshold.service';
import { AdjustmentApprovalService } from './approvals/adjustment-approval.service';
import { AutoApprovalProcessor } from './approvals/auto-approval.processor';
import { ClassificationService } from './classifications/classification.service';
import { OnHandWebController } from './web/on-hand.controller';
import { LpnWebController } from './web/lpn.controller';
import { LotWebController } from './web/lot.controller';
import { TransactionWebController } from './web/transaction.controller';
import { HoldWebController } from './web/hold.controller';
import { AdjustmentWebController } from './web/adjustment.controller';
import { CycleCountWebController } from './web/cycle-count.controller';
import { AllocationWebController } from './web/allocation.controller';
import { ApprovalWebController } from './web/approval.controller';
import { ClassificationWebController } from './web/classification.controller';
import { CycleCountRfController } from './rf/cycle-count.controller';
import { LpnRfController } from './rf/lpn.controller';
import { InventoryRfController } from './rf/inventory.controller';
import { ReplenishmentRfController } from './replenishment/rf/replenishment.controller';

@Module({
  imports: [
    PrismaModule,
    OutboundModule,
    SecurityModule,
    BullModule.registerQueue({ name: 'auto-approval-processor' }),
  ],
  controllers: [
    OnHandWebController,
    LpnWebController,
    LotWebController,
    TransactionWebController,
    HoldWebController,
    AdjustmentWebController,
    CycleCountWebController,
    AllocationWebController,
    ApprovalWebController,
    ClassificationWebController,
    CycleCountRfController,
    LpnRfController,
    InventoryRfController,
    ReplenishmentRfController,
  ],
  providers: [
    OnHandService,
    LpnService,
    LotService,
    TransactionService,
    HoldService,
    AdjustmentService,
    CycleCountService,
    AllocationService,
    ApprovalThresholdService,
    AdjustmentApprovalService,
    AutoApprovalProcessor,
    ClassificationService,
  ],
  exports: [
    OnHandService,
    LpnService,
    LotService,
    TransactionService,
    HoldService,
    AdjustmentService,
    CycleCountService,
    AllocationService,
    AdjustmentApprovalService,
    ClassificationService,
  ],
})
export class InventoryModule {}
