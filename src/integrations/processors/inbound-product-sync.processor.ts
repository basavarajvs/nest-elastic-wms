import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CoreIntegrationClientService } from '../core-integration-client.service';
import { AdapterFactory } from '../adapters/adapter-factory';

export const PRODUCT_SYNC_QUEUE = 'integration-inbound-products';

@Processor(PRODUCT_SYNC_QUEUE, { concurrency: 2 })
@Injectable()
export class InboundProductSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(InboundProductSyncProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly coreIntegration: CoreIntegrationClientService,
    private readonly adapterFactory: AdapterFactory,
  ) {
    super();
  }

  async process(job: Job<{ tenantId: string; platform: string; credentials: any; lastSyncAt?: string }>) {
    const { tenantId, platform, credentials, lastSyncAt } = job.data;
    this.logger.log(`Processing product sync for tenant=${tenantId}, platform=${platform}`);

    const syncLog = await (this.prisma as any).integrationSyncLog.create({
      data: {
        tenantId,
        platform,
        syncType: 'PRODUCT_IMPORT',
        status: 'PROCESSING',
        startedAt: new Date(),
      },
    });

    try {
      const adapter = this.adapterFactory.createAdapter(platform, credentials, tenantId);
      const since = lastSyncAt ? new Date(lastSyncAt) : undefined;
      const { items } = await adapter.syncProducts(tenantId, since);

      let succeeded = 0;
      let failed = 0;

      for (const item of items) {
        try {
          const existing = await (this.prisma as any).externalEntityMapping.findFirst({
            where: { tenantId, platform, externalId: item.externalId, entityType: 'PRODUCT' },
          });

          if (existing) {
            const oldProduct = await (this.prisma as any).product.findFirst({
              where: { id: existing.wmsEntityId, tenantId },
              select: { productCode: true },
            });
            const oldSkus: string[] = existing.historicalSkus || [];
            if (oldProduct && oldProduct.productCode !== item.sku) {
              oldSkus.push(oldProduct.productCode);
            }

            await (this.prisma as any).product.update({
              where: { id: existing.wmsEntityId },
              data: {
                name: item.name,
                description: item.description,
                isActive: item.isActive,
              },
            });

            await (this.prisma as any).externalEntityMapping.update({
              where: { id: existing.id },
              data: { lastSyncedAt: new Date(), historicalSkus: oldSkus },
            });
          } else {
            const product = await (this.prisma as any).product.create({
              data: {
                tenantId,
                categoryId: credentials.defaultCategoryId || (await this.getDefaultCategory(tenantId)),
                baseUomId: credentials.defaultUomId || (await this.getDefaultUom(tenantId)),
                productCode: item.sku || `EXT-${item.externalId}`,
                name: item.name,
                description: item.description,
                isActive: item.isActive ?? true,
                trackLot: false,
                trackSerial: false,
              },
            });

            await (this.prisma as any).externalEntityMapping.create({
              data: {
                tenantId,
                platform,
                externalId: item.externalId,
                entityType: 'PRODUCT',
                wmsEntityId: product.id,
                wmsEntityType: 'Product',
                syncDirection: 'BIDIRECTIONAL',
                lastSyncedAt: new Date(),
              },
            });
          }

          if (item.barcode) {
            await this.upsertBarcode(tenantId, existing?.wmsEntityId || (await this.getCreatedId()), item.barcode);
          }

          succeeded++;
        } catch (err: any) {
          this.logger.error(`Failed to sync product ${item.externalId}: ${err.message}`);
          failed++;
        }
      }

      const status = failed > 0 && succeeded > 0 ? 'PARTIAL' : failed > 0 ? 'FAILED' : 'COMPLETED';
      await (this.prisma as any).integrationSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status,
          recordsProcessed: items.length,
          recordsSucceeded: succeeded,
          recordsFailed: failed,
          completedAt: new Date(),
          errorSummary: failed > 0 ? `${failed} products failed to sync` : null,
        },
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

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Product sync job ${job.id} failed: ${err.message}`);
  }

  private async getDefaultCategory(tenantId: string): Promise<string> {
    const cat = await (this.prisma as any).productCategory.findFirst({ where: { tenantId } });
    return cat?.id || '00000000-0000-0000-0000-000000000001';
  }

  private async getDefaultUom(tenantId: string): Promise<string> {
    const uom = await (this.prisma as any).unitOfMeasure.findFirst({ where: { tenantId } });
    return uom?.id || '00000000-0000-0000-0000-000000000001';
  }

  private async getCreatedId(): Promise<string> {
    return '';
  }

  private async upsertBarcode(tenantId: string, productId: string, barcode: string): Promise<void> {
    try {
      const existing = await (this.prisma as any).productBarcode.findFirst({
        where: { tenantId, barcodeValue: barcode },
      });
      if (!existing && productId) {
        await (this.prisma as any).productBarcode.create({
          data: { tenantId, productId, barcodeValue: barcode, type: 'EAN13', isPrimary: true },
        });
      }
    } catch (err: any) {
      this.logger.warn(`Failed to upsert barcode ${barcode}: ${err.message}`);
    }
  }
}
