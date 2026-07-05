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
import { DamageCodeService } from './receiving/damage-code.service';
import { ReceivingToleranceService } from './receiving/receiving-tolerance.service';
import { ReceivingApprovalService } from './receiving/receiving-approval.service';
import { InboundTrailerService } from './trailers/trailer.service';
import { PurchaseOrderController } from './purchase-orders/web/purchase-order.controller';
import { RfPurchaseOrderController } from './purchase-orders/rf/purchase-order.controller';
import { AsnController } from './asn/web/asn.controller';
import { ReceivingController } from './receiving/web/receiving.controller';
import { RfReceivingController } from './receiving/rf/receiving.controller';
import { PutawayController, PutawayRuleController } from './putaway/web/putaway.controller';
import { LocationExceptionWebController } from './putaway/web/location-exception.controller';
import { RfPutawayController } from './putaway/rf/putaway.controller';
import { ReturnsController } from './returns/web/returns.controller';
import { RfReturnsController } from './returns/rf/returns.controller';
import { DamageCodeWebController } from './receiving/web/damage-code.controller';
import { ReceivingToleranceWebController } from './receiving/web/receiving-tolerance.controller';
import { ReceivingApprovalWebController } from './receiving/web/receiving-approval.controller';
import { InboundTrailerWebController } from './trailers/web/trailer.controller';
import { RfInboundTrailerController } from './trailers/rf/trailer.controller';

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
    LocationExceptionWebController,
    PutawayController,
    PutawayRuleController,
    RfPutawayController,
    ReturnsController,
    RfReturnsController,
    DamageCodeWebController,
    ReceivingToleranceWebController,
    ReceivingApprovalWebController,
    InboundTrailerWebController,
    RfInboundTrailerController,
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
    DamageCodeService,
    ReceivingToleranceService,
    ReceivingApprovalService,
    InboundTrailerService,
  ],
  exports: [
    PurchaseOrderService,
    AsnService,
    ReceivingService,
    PutawayService,
    ReturnsService,
    DamageCodeService,
    ReceivingToleranceService,
    ReceivingApprovalService,
    InboundTrailerService,
  ],
})
export class InboundModule {}
