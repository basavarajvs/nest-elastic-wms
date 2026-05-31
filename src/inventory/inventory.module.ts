import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { InventoryTransactionService } from './inventory-transaction.service';
import { InventoryOnHandService } from './inventory-onhand.service';
import { InventoryHoldService } from './inventory-hold.service';
import { InventoryAdjustmentService } from './inventory-adjustment.service';
import { InventoryPolicyService } from './inventory-policy.service';
import { InventoryReconciliationService } from './inventory-reconciliation.service';
import { InventoryReconciliationProcessor } from './inventory-reconciliation.processor';
import { InventoryAlertProcessor } from './inventory-alert.processor';
import { InventorySeederService } from './inventory-seeder.service';
import { InventoryLotService } from './inventory-lot.service';
import { InventoryWebController } from './web/inventory.controller';
import { InventoryRfController } from './rf/inventory.controller';
import { HoldOverrideGuard } from '../common/guards/hold-override.guard';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'inventory-alerts' },
      { name: 'inventory-reconciliation' },
    ),
  ],
  controllers: [InventoryWebController, InventoryRfController],
  providers: [
    InventoryTransactionService,
    InventoryOnHandService,
    InventoryHoldService,
    InventoryAdjustmentService,
    InventoryPolicyService,
    InventoryReconciliationService,
    InventoryReconciliationProcessor,
    InventoryAlertProcessor,
    InventorySeederService,
    InventoryLotService,
    HoldOverrideGuard,
  ],
  exports: [
    InventoryTransactionService,
    InventoryOnHandService,
    InventoryHoldService,
    InventoryAdjustmentService,
    InventoryLotService,
    InventoryPolicyService,
    InventorySeederService,
  ],
})
export class InventoryModule {}
