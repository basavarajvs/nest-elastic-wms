import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common/cache/redis.constants';
import { OnEvent } from '@nestjs/event-emitter';

const ATTR_CACHE_TTL = 120; // 2 minutes

@Injectable()
export class AttributeService {
  private readonly logger = new Logger(AttributeService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async upsert(productId: string, key: string, value: string, tenantId: string): Promise<void> {
    await (this.prisma as any).productAttribute.upsert({
      where: {
        product_attributes_uq: { tenantId, productId, key },
      },
      update: { value },
      create: { tenantId, productId, key, value },
    });
    await this.invalidateAttrCache(productId);
  }

  async getByProductId(productId: string, tenantId: string): Promise<Record<string, string>> {
    const cacheKey = `prod:attrs:${productId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const attrs = await (this.prisma as any).productAttribute.findMany({
      where: { productId, tenantId, isActive: true },
      select: { key: true, value: true },
    });

    const result: Record<string, string> = {};
    for (const a of attrs) result[a.key] = a.value;

    await this.redis.setex(cacheKey, ATTR_CACHE_TTL, JSON.stringify(result));
    return result;
  }

  async invalidateAttrCache(productId: string): Promise<void> {
    await this.redis.del(`prod:attrs:${productId}`);
  }

  // Challenge 4: AttributeCacheInvalidator — listens to product changes and purges caches
  @OnEvent('product.updated')
  @OnEvent('product.created')
  async handleProductChanged(payload: { id: string; tenantId: string; barcodes?: string[] }) {
    await this.invalidateAttrCache(payload.id);

    // Purge barcode caches if barcodes changed
    if (payload.barcodes) {
      for (const barcode of payload.barcodes) {
        await this.redis.del(`barcode:${barcode}`);
      }
    }

    // Redis PubSub for horizontally scaled nodes
    await this.redis.publish(
      'wms:cache:clear',
      JSON.stringify({
        type: 'product.updated',
        productId: payload.id,
        timestamp: Date.now(),
      }),
    );
  }
}
