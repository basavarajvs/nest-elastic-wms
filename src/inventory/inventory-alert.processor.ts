import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

@Processor('inventory-alerts')
export class InventoryAlertProcessor extends WorkerHost {
  private readonly logger = new Logger(InventoryAlertProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async process(job?: Job): Promise<void> {
    this.logger.log(`Processing inventory alert job: ${job?.id || 'cron-triggered'}`);

    const lowStockItems = await (this.prisma as any).$queryRawUnsafe(`
      SELECT
        ip.tenant_id,
        ip.facility_id,
        ip.product_id,
        p.product_code as sku,
        p.name,
        ip.reorder_point,
        ip.safety_stock,
        COALESCE(SUM(ioh.quantity_on_hand), 0) as total_on_hand
      FROM multitenant.inventory_policies ip
      JOIN multitenant.products p ON p.id = ip.product_id
      LEFT JOIN multitenant.inventory_on_hand ioh
        ON ioh.product_id = ip.product_id
        AND ioh.tenant_id = ip.tenant_id
        AND ioh.facility_id = ip.facility_id
      WHERE ip.is_active = true
      GROUP BY ip.tenant_id, ip.facility_id, ip.product_id, p.product_code, p.name, ip.reorder_point, ip.safety_stock
      HAVING COALESCE(SUM(ioh.quantity_on_hand), 0) <= (ip.reorder_point + ip.safety_stock)
    `);

    if (Array.isArray(lowStockItems) && lowStockItems.length > 0) {
      this.logger.warn(`Low stock alert: ${lowStockItems.length} items below reorder point`);
      for (const item of lowStockItems) {
        this.logger.warn(
          `[${item.tenant_id}] ${item.sku} (${item.name}): ${item.total_on_hand} on hand, reorder at ${item.reorder_point}`,
        );

        this.eventEmitter.emit('inventory.low_stock', {
          productCode: item.sku,
          productId: item.product_id,
          currentQty: Number(item.total_on_hand),
          availableQty: Number(item.total_on_hand),
          reorderPoint: Number(item.reorder_point),
          locationCode: '',
          tenantId: item.tenant_id,
        });
      }
    }
  }
}
