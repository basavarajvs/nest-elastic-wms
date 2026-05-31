import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WmsNotificationClientService } from './wms-notification-client.service';
import { WmsNotificationProcessor } from './notification.processor';
import { NotificationAuditStreamerService } from './notification-audit-streamer.service';
import { RfSessionTimeoutJob } from './rf-session-timeout.job';
import { LowStockListener } from './listeners/low-stock.listener';
import { OrderStatusListener } from './listeners/order-status.listener';
import { InboundListener } from './listeners/inbound.listener';
import { SystemListener } from './listeners/system.listener';
import { ComplianceNotificationGuard } from './guards/compliance-notification.guard';
import { UserAttributeService } from './user-attribute.service';
import { NotificationAdminController } from './web/notification-admin.controller';
import { NotificationRfController } from './rf/notification-rf.controller';

const MDC_QUEUE = 'wms-notifications';
const DLQ_QUEUE = `${MDC_QUEUE}-dlq`;

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: MDC_QUEUE,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      {
        name: DLQ_QUEUE,
        defaultJobOptions: {
          attempts: 1,
          removeOnComplete: true,
        },
      },
    ),
  ],
  controllers: [NotificationAdminController, NotificationRfController],
  providers: [
    WmsNotificationClientService,
    WmsNotificationProcessor,
    NotificationAuditStreamerService,
    RfSessionTimeoutJob,
    LowStockListener,
    OrderStatusListener,
    InboundListener,
    SystemListener,
    ComplianceNotificationGuard,
    UserAttributeService,
  ],
  exports: [
    WmsNotificationClientService,
    ComplianceNotificationGuard,
    NotificationAuditStreamerService,
    BullModule,
  ],
})
export class NotificationModule {}
