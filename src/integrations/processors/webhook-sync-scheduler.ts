import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { PendingOrderBufferService } from './pending-order-buffer.service';
import { ORDER_SYNC_QUEUE } from './inbound-order-sync.processor';

@Injectable()
export class WebhookSyncScheduler {
  private readonly logger = new Logger(WebhookSyncScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bufferService: PendingOrderBufferService,
    @InjectQueue(ORDER_SYNC_QUEUE) private readonly orderQueue: Queue,
  ) {}

  @Cron('*/30 * * * * *')
  async flushPendingOrderBuffers() {
    const tenants = await (this.prisma as any).externalEntityMapping.findMany({
      where: { entityType: 'ORDER' },
      select: { tenantId: true },
      distinct: ['tenantId'],
    });

    for (const { tenantId } of tenants) {
      const readyIds = await this.bufferService.flushReadyBuffers(tenantId, 'SHOPIFY');
      for (const orderId of readyIds) {
        const events = await this.bufferService.getAndFlush(tenantId, orderId);
        if (events) {
          await this.orderQueue.add('process-order', {
            tenantId,
            platform: 'SHOPIFY',
            credentials: {},
            eventType: 'orders/create',
            parsedBody: events['orders/create'] || { id: orderId },
          });
        }
      }
    }
  }
}
