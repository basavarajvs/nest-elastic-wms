import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { InventoryTransferService } from './inventory-transfer.service';
import { TransferWebController } from './web/transfers.controller';
import { TransferLineWebController } from './web/transfer-lines.controller';
import { TransferRfController } from './rf/transfers.controller';
import { TransferReconciliationProcessor } from './transfer-reconciliation.processor';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [BullModule.registerQueue({ name: 'transfer-reconciliation', defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 60000 }, removeOnComplete: 100, removeOnFail: 25 } }), InventoryModule],
  controllers: [TransferWebController, TransferLineWebController, TransferRfController],
  providers: [InventoryTransferService, TransferReconciliationProcessor],
  exports: [InventoryTransferService],
})
export class TransfersModule {}
