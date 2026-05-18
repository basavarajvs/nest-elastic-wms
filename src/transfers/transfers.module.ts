import { Module } from '@nestjs/common';
import { InventoryTransferService } from './inventory-transfer.service';
import { TransferWebController } from './web/transfers.controller';
import { TransferRfController } from './rf/transfers.controller';

@Module({
  controllers: [TransferWebController, TransferRfController],
  providers: [InventoryTransferService],
  exports: [InventoryTransferService],
})
export class TransfersModule {}
