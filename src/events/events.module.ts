import { Module } from '@nestjs/common';
import { FulfillmentModule } from '../fulfillment/fulfillment.module';
import { AuditListener } from './listeners/audit.listener';
import { BillingListener } from './listeners/billing.listener';
import { InventoryListener } from './listeners/inventory.listener';
import { WorkflowListener } from './listeners/workflow.listener';
import { FulfillmentListener } from './listeners/fulfillment.listener';
import { NotificationListener } from './listeners/notification.listener';

@Module({
  imports: [FulfillmentModule],
  providers: [
    AuditListener,
    BillingListener,
    InventoryListener,
    WorkflowListener,
    FulfillmentListener,
    NotificationListener,
  ],
})
export class EventsModule {}
