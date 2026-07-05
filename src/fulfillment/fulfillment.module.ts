import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FulfillmentWorkflowService } from './fulfillment-workflow.service';
import { FulfillmentBillingService } from './fulfillment-billing.service';
import { FulfillmentWebController } from './web/fulfillment.controller';

@Module({
  imports: [PrismaModule],
  controllers: [FulfillmentWebController],
  providers: [FulfillmentWorkflowService, FulfillmentBillingService],
  exports: [FulfillmentWorkflowService, FulfillmentBillingService],
})
export class FulfillmentModule {}
