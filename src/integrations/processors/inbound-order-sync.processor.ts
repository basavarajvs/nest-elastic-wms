import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CoreIntegrationClientService } from '../core-integration-client.service';
import { AdapterFactory } from '../adapters/adapter-factory';
import { PendingOrderBufferService } from './pending-order-buffer.service';
import { OrderLineMatcherService } from './order-line-matcher.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export const ORDER_SYNC_QUEUE = 'integration-inbound-orders';

@Processor(ORDER_SYNC_QUEUE, { concurrency: 2 })
@Injectable()
export class InboundOrderSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(InboundOrderSyncProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly coreIntegration: CoreIntegrationClientService,
    private readonly adapterFactory: AdapterFactory,
    private readonly bufferService: PendingOrderBufferService,
    private readonly lineMatcher: OrderLineMatcherService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<{ tenantId: string; platform: string; credentials: any; eventType: string; parsedBody: any; externalOrderIds?: string[] }>) {
    const { tenantId, platform, credentials, eventType, parsedBody, externalOrderIds } = job.data;
    this.logger.log(`Processing order sync: tenant=${tenantId}, platform=${platform}, type=${eventType}`);

    const syncLog = await (this.prisma as any).integrationSyncLog.create({
      data: { tenantId, platform, syncType: 'ORDER_SYNC', status: 'PROCESSING', startedAt: new Date() },
    });

    try {
      const adapter = this.adapterFactory.createAdapter(platform, credentials, tenantId);

      const externalOrderId = parsedBody?.id ? String(parsedBody.id) : null;
      if (externalOrderId && eventType !== 'orders/create') {
        await this.bufferService.holdEvent(tenantId, externalOrderId, eventType, parsedBody);
        const hasCreate = await this.bufferService.hasCreateEvent(tenantId, externalOrderId);
        if (!hasCreate) {
          await (this.prisma as any).integrationSyncLog.update({
            where: { id: syncLog.id },
            data: { status: 'PENDING', recordsProcessed: 1, completedAt: new Date() },
          });
          return { held: true, reason: 'Waiting for orders/create event' };
        }
      }

      const { items } = await adapter.syncOrders(tenantId, externalOrderIds);

      let succeeded = 0;
      let failed = 0;

      for (const item of items) {
        try {
          const existingMapping = await (this.prisma as any).externalEntityMapping.findFirst({
            where: { tenantId, platform, externalId: item.externalId, entityType: 'ORDER' },
          });
          if (existingMapping) {
            const existingOrder = await (this.prisma as any).salesOrder.findFirst({
              where: { id: existingMapping.wmsEntityId, tenantId },
            });
            if (existingOrder && existingOrder.status === 'CREATED') {
              const wmsStatus = adapter.mapExternalOrderToWmsOrder(item, tenantId).status;
              await (this.prisma as any).salesOrder.update({
                where: { id: existingOrder.id },
                data: { status: wmsStatus, deliveryAddress: item.deliveryAddress || undefined },
              });
            }
            succeeded++;
            continue;
          }

          const mappedOrder = adapter.mapExternalOrderToWmsOrder(item, tenantId);
          const lineData: any[] = [];
          const defaultFacilityId = await this.resolveFacilityId(tenantId, credentials);

          for (const line of mappedOrder.lines) {
            const wmsProductId = await this.lineMatcher.resolveProductId(tenantId, line.sku, line.externalProductId);
            if (!wmsProductId) {
              this.logger.warn(`Unknown product for sku=${line.sku}, extId=${line.externalProductId}`);
              failed++;
              continue;
            }
            lineData.push({
              tenantId,
              facilityId: defaultFacilityId,
              productId: wmsProductId,
              requestedQuantity: line.requestedQuantity,
              uomId: credentials.defaultUomId,
            });
          }

          if (lineData.length === 0) continue;

          const order = await (this.prisma as any).salesOrder.create({
            data: {
              tenantId,
              facilityId: defaultFacilityId,
              orderNumber: mappedOrder.orderNumber,
              clientCode: mappedOrder.clientCode,
              status: mappedOrder.status,
              deliveryAddress: mappedOrder.deliveryAddress || undefined,
              lines: { create: lineData },
            },
          });

          await (this.prisma as any).externalEntityMapping.create({
            data: {
              tenantId, platform, externalId: item.externalId, entityType: 'ORDER',
              wmsEntityId: order.id, wmsEntityType: 'SalesOrder',
              lastSyncedAt: new Date(),
            },
          });

          this.eventEmitter.emit('order.created', { orderId: order.id, tenantId });
          succeeded++;
        } catch (err: any) {
          this.logger.error(`Order sync failed for ${item.externalId}: ${err.message}`);
          failed++;
        }
      }

      const status = failed > 0 && succeeded > 0 ? 'PARTIAL' : failed > 0 ? 'FAILED' : 'COMPLETED';
      await (this.prisma as any).integrationSyncLog.update({
        where: { id: syncLog.id },
        data: { status, recordsProcessed: items.length, recordsSucceeded: succeeded, recordsFailed: failed, completedAt: new Date() },
      });

      return { processed: items.length, succeeded, failed };
    } catch (err: any) {
      await (this.prisma as any).integrationSyncLog.update({
        where: { id: syncLog.id },
        data: { status: 'FAILED', errorSummary: err.message, completedAt: new Date() },
      });
      throw err;
    }
  }

  private async resolveFacilityId(tenantId: string, credentials: any): Promise<string> {
    if (credentials.defaultFacilityId) return credentials.defaultFacilityId;
    const facility = await (this.prisma as any).warehouseFacility.findFirst({
      where: { tenantId, isActive: true },
      select: { id: true },
    });
    return facility?.id || '00000000-0000-0000-0000-000000000001';
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Order sync job ${job.id} failed: ${err.message}`);
  }
}
