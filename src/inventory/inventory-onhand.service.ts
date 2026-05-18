import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';

@Injectable()
export class InventoryOnHandService {
  private readonly logger = new Logger(InventoryOnHandService.name);
  private readonly CACHE_TTL = 30;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async findStock(tenantId: string, filters: {
    facilityId?: string;
    productId?: string;
    locationId?: string;
    lotId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 200);
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (filters.facilityId) where.facilityId = filters.facilityId;
    if (filters.productId) where.productId = filters.productId;
    if (filters.locationId) where.locationId = filters.locationId;
    if (filters.lotId) where.lotId = filters.lotId;

    const [data, total] = await Promise.all([
      (this.prisma as any).inventoryOnHand.findMany({
        where,
        skip,
        take: limit,
        include: {
          lot: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      (this.prisma as any).inventoryOnHand.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getAvailableQuantity(tenantId: string, productId: string, facilityId: string): Promise<number> {
    const cacheKey = `inventory:availability:${productId}:${facilityId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached !== null) return parseFloat(cached);

    const result = await (this.prisma as any).inventoryOnHand.aggregate({
      where: { tenantId, productId, facilityId },
      _sum: { quantityOnHand: true },
    });
    const total = result._sum.quantityOnHand || 0;
    await this.redis.set(cacheKey, total.toString(), 'EX', this.CACHE_TTL);
    return total;
  }

  async findFEFO(tenantId: string, productId: string, facilityId: string, quantity: number): Promise<any[]> {
    const lots = await (this.prisma as any).$queryRawUnsafe(`
      SELECT
        ioh.id,
        ioh.location_id,
        ioh.lot_id,
        ioh.quantity_on_hand,
        ioh.uom_id,
        il.expiry_date,
        il.lot_number
      FROM multitenant.inventory_on_hand ioh
      JOIN multitenant.inventory_lots il ON il.id = ioh.lot_id
      JOIN multitenant.storage_locations l ON l.id = ioh.location_id
      WHERE ioh.tenant_id = $1::uuid
        AND ioh.facility_id = $2::uuid
        AND ioh.product_id = $3::uuid
        AND ioh.quantity_on_hand > 0
      ORDER BY COALESCE(il.expiry_date, '9999-12-31') ASC
    `, tenantId, facilityId, productId);

    const picks: any[] = [];
    let remaining = quantity;
    for (const lot of lots) {
      const take = Math.min(lot.quantity_on_hand, remaining);
      picks.push({
        locationId: lot.location_id,
        lotId: lot.lot_id,
        quantity: take,
        uomId: lot.uom_id,
      });
      remaining -= take;
      if (remaining <= 0) break;
    }
    if (remaining > 0) return [];
    return picks;
  }

  async scanLocation(tenantId: string, facilityId: string, locationId: string): Promise<any[]> {
    return (this.prisma as any).inventoryOnHand.findMany({
      where: { tenantId, facilityId, locationId, quantityOnHand: { gt: 0 } },
      include: { lot: true },
    });
  }

  async getLowStockItems(tenantId: string, facilityId: string): Promise<any[]> {
    return (this.prisma as any).$queryRawUnsafe(`
      SELECT
        ip.product_id,
        p.product_code as sku,
        p.name,
        ip.reorder_point,
        ip.safety_stock,
        ip.max_stock_level,
        COALESCE(SUM(ioh.quantity_on_hand), 0) as total_on_hand
      FROM multitenant.inventory_policies ip
      JOIN multitenant.products p ON p.id = ip.product_id
      LEFT JOIN multitenant.inventory_on_hand ioh
        ON ioh.product_id = ip.product_id
        AND ioh.tenant_id = ip.tenant_id
        AND ioh.facility_id = ip.facility_id
      WHERE ip.tenant_id = $1::uuid
        AND ip.facility_id = $2::uuid
        AND ip.is_active = true
      GROUP BY ip.product_id, p.product_code, p.name, ip.reorder_point, ip.safety_stock, ip.max_stock_level
      HAVING COALESCE(SUM(ioh.quantity_on_hand), 0) <= (ip.reorder_point + ip.safety_stock)
      ORDER BY total_on_hand ASC
    `, tenantId, facilityId);
  }
}
