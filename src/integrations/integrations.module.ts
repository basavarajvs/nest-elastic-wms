import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CoreIntegrationClientService } from './core-integration-client.service';
import { AdapterFactory } from './adapters/adapter-factory';
import { InboundProductSyncProcessor, PRODUCT_SYNC_QUEUE } from './processors/inbound-product-sync.processor';
import { InboundOrderSyncProcessor, ORDER_SYNC_QUEUE } from './processors/inbound-order-sync.processor';
import { OutboundInventorySyncProcessor, INVENTORY_SYNC_QUEUE } from './processors/outbound-inventory-sync.processor';
import { PendingOrderBufferService } from './processors/pending-order-buffer.service';
import { OrderLineMatcherService } from './processors/order-line-matcher.service';
import { BatchedInventorySyncService } from './processors/batched-inventory-sync.service';
import { WebhookSyncScheduler } from './processors/webhook-sync-scheduler';
import { InventorySyncScheduler } from './processors/inventory-sync-scheduler';
import { WebhooksController } from './webhooks/webhooks.controller';
import { TokenBucketRateLimiter } from '../common/rate-limiter/token-bucket.rate-limiter';

const INTEGRATION_QUEUES = [PRODUCT_SYNC_QUEUE, ORDER_SYNC_QUEUE, INVENTORY_SYNC_QUEUE];

@Module({
  imports: [
    BullModule.registerQueue(
      ...INTEGRATION_QUEUES.map((name) => ({
        name,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      })),
    ),
  ],
  controllers: [WebhooksController],
  providers: [
    CoreIntegrationClientService,
    AdapterFactory,
    InboundProductSyncProcessor,
    InboundOrderSyncProcessor,
    OutboundInventorySyncProcessor,
    PendingOrderBufferService,
    OrderLineMatcherService,
    BatchedInventorySyncService,
    WebhookSyncScheduler,
    InventorySyncScheduler,
    TokenBucketRateLimiter,
  ],
  exports: [
    CoreIntegrationClientService,
    AdapterFactory,
    InboundOrderSyncProcessor,
    BatchedInventorySyncService,
    TokenBucketRateLimiter,
  ],
})
export class IntegrationsModule {}
