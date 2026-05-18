import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OrderLineMatcherService {
  private readonly logger = new Logger(OrderLineMatcherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async resolveProductId(tenantId: string, sku: string, externalProductId: string): Promise<string | null> {
    const mapping = await (this.prisma as any).externalEntityMapping.findFirst({
      where: {
        tenantId,
        platform: { in: ['SHOPIFY', 'WOOCOMMERCE'] },
        externalId: externalProductId,
        entityType: 'PRODUCT',
      },
    });

    if (mapping) return mapping.wmsEntityId;

    const bySku = await (this.prisma as any).product.findFirst({
      where: { tenantId, productCode: sku },
      select: { id: true },
    });
    if (bySku) return bySku.id;

    const historicalMatch = await (this.prisma as any).externalEntityMapping.findFirst({
      where: {
        tenantId,
        platform: { in: ['SHOPIFY', 'WOOCOMMERCE'] },
        entityType: 'PRODUCT',
        historicalSkus: { has: sku },
      },
      select: { wmsEntityId: true, externalId: true },
    });
    if (historicalMatch) return historicalMatch.wmsEntityId;

    this.eventEmitter.emit('order.line.unknown-product', {
      tenantId,
      externalProductId,
      sku,
    });

    return null;
  }
}
