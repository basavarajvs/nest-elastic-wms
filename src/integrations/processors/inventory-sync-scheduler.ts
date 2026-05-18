import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { BatchedInventorySyncService } from './batched-inventory-sync.service';
import { INVENTORY_SYNC_QUEUE } from './outbound-inventory-sync.processor';

@Injectable()
export class InventorySyncScheduler {
  private readonly logger = new Logger(InventorySyncScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly batchedSync: BatchedInventorySyncService,
    @InjectQueue(INVENTORY_SYNC_QUEUE) private readonly inventoryQueue: Queue,
  ) {}

  @Cron('*/30 * * * * *')
  async flushBatches() {
    const integrations = await (this.prisma as any).externalEntityMapping.findMany({
      where: {
        entityType: 'PRODUCT',
        syncDirection: { in: ['OUTBOUND', 'BIDIRECTIONAL'] },
      },
      select: { tenantId: true, platform: true },
      distinct: ['tenantId', 'platform'],
    });

    for (const { tenantId, platform } of integrations) {
      const batches = await this.batchedSync.flushReadyBatches(tenantId);
      if (batches.length > 0) {
        await this.inventoryQueue.add('push-inventory', {
          tenantId,
          platform,
          credentials: {},
        });
      }
    }
  }
}
