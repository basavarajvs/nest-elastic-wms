import { Module } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderWebController } from './web/purchase-order.controller';
import { PurchaseOrderLineWebController } from './web/purchase-order-line.controller';

@Module({
  controllers: [PurchaseOrderWebController, PurchaseOrderLineWebController],
  providers: [PurchaseOrderService],
  exports: [PurchaseOrderService],
})
export class PurchaseOrderModule {}
