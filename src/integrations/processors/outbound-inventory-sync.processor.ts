import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CoreIntegrationClientService } from '../core-integration-client.service';
import { AdapterFactory } from '../adapters/adapter-factory';
import { BatchedInventorySyncService } from './batched-inventory-sync.service';
import { InventorySyncDto } from '../dtos/integration.dto';
import { OnEvent } from '@nestjs/event-emitter';

export const INVENTORY_SYNC_QUEUE = 'integration-outbound-inventory';

@Processor(INVENTORY_SYNC_QUEUE, { concurrency: 1 })
@Injectable()
export class OutboundInventorySyncProcessor extends WorkerHost {
  private readonly logger = new Logger(OutboundInventorySyncProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly coreIntegration: CoreIntegrationClientService,
    private readonly adapterFactory: AdapterFactory,
    private readonly batchedSync: BatchedInventorySyncService,
  ) {
    super();
  }

  @OnEvent('inventory.transacted')
  async onInventoryTransacted(payload: { tenantId: string; productId: string; facilityId: string; quantityDelta: number; uomId: string }) {
    const mappings = await (this.prisma as any).externalEntityMapping.findMany({
      where: {
        tenantId: payload.tenantId,
        entityType: 'PRODUCT',
        wmsEntityId: payload.productId,
        syncDirection: { in: ['OUTBOUND', 'BIDIRECTIONAL'] },
      },
      select: { externalId: true, platform: true },
    });

    for (const map of mappings) {
      await this.batchedSync.accumulate(payload.tenantId, {
        productId: payload.productId,
        externalVariantId: map.externalId,
        facilityId: payload.facilityId,
        quantityDelta: payload.quantityDelta,
      });
    }
  }

  async process(job: Job<{ tenantId: string; platform: string; credentials: any }>) {
    const { tenantId, platform, credentials } = job.data;
    this.logger.log(`Processing inventory push: tenant=${tenantId}, platform=${platform}`);

    const adapter = this.adapterFactory.createAdapter(platform, credentials, tenantId);
    const batches = await this.batchedSync.flushReadyBatches(tenantId);

    if (batches.length === 0) return { pushed: 0 };

    const updates: InventorySyncDto[] = batches.map((b) => ({
      productId: b.productId,
      facilityId: b.facilityId,
      externalVariantId: b.externalVariantId,
      quantity: b.quantityDelta,
    }));

    const result = await adapter.pushInventory(updates);

    await (this.prisma as any).integrationSyncLog.create({
      data: {
        tenantId,
        platform,
        syncType: 'INVENTORY_PUSH',
        status: result.success ? 'COMPLETED' : 'PARTIAL',
        recordsProcessed: result.recordsProcessed,
        recordsSucceeded: result.recordsSucceeded,
        recordsFailed: result.recordsFailed,
        errorSummary: result.errors.length > 0 ? result.errors.join('; ') : null,
        completedAt: new Date(),
      },
    });

    return { pushed: result.recordsSucceeded, failed: result.recordsFailed };
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Inventory push job ${job.id} failed: ${err.message}`);
  }
}
