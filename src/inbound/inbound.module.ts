import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { PurchaseOrderService } from './purchase-orders/purchase-order.service';
import { AsnService } from './asn/asn.service';
import { AsnImportService } from './asn/asn-import.service';
import { AsnImportProcessor } from './asn/asn-import.processor';
import { ReceivingService } from './receiving/receiving.service';
import { PutawayService } from './putaway/putaway.service';
import { PutawayRuleService } from './putaway/putaway-rule.service';
import { ReturnsService } from './returns/returns.service';
import { PurchaseOrderController } from './purchase-orders/web/purchase-order.controller';
import { RfPurchaseOrderController } from './purchase-orders/rf/purchase-order.controller';
import { AsnController } from './asn/web/asn.controller';
import { ReceivingController } from './receiving/web/receiving.controller';
import { RfReceivingController } from './receiving/rf/receiving.controller';
import { PutawayController, PutawayRuleController } from './putaway/web/putaway.controller';
import { RfPutawayController } from './putaway/rf/putaway.controller';
import { ReturnsController } from './returns/web/returns.controller';
import { RfReturnsController } from './returns/rf/returns.controller';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({ name: 'asn-import' }),
  ],
  controllers: [
    PurchaseOrderController,
    RfPurchaseOrderController,
    AsnController,
    ReceivingController,
    RfReceivingController,
    PutawayController,
    PutawayRuleController,
    RfPutawayController,
    ReturnsController,
    RfReturnsController,
  ],
  providers: [
    PurchaseOrderService,
    AsnService,
    AsnImportService,
    AsnImportProcessor,
    ReceivingService,
    PutawayService,
    PutawayRuleService,
    ReturnsService,
  ],
  exports: [
    PurchaseOrderService,
    AsnService,
    ReceivingService,
    PutawayService,
    ReturnsService,
  ],
})
export class InboundModule {}
