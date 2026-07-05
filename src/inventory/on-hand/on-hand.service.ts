import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OnHandService {
  constructor(private readonly prisma: PrismaService) {}

  async delete(tenantId: string, id: bigint) {
    return this.prisma.inventory_on_hand.deleteMany({
      where: { tenant_id: tenantId, on_hand_id: id },
    });
  }

  async findAll(tenantId: string, query: any) {
    const { locationId, productId, lotId, facilityId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId };
    if (locationId) where.location_id = BigInt(locationId);
    if (productId) where.product_id = BigInt(productId);
    if (lotId) where.lot_id = BigInt(lotId);
    if (facilityId) where.facility_id = BigInt(facilityId);
    const [data, total] = await Promise.all([
      this.prisma.inventory_on_hand.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.inventory_on_hand.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: string) {
    return this.prisma.inventory_on_hand.findFirst({
      where: { tenant_id: tenantId, on_hand_id: BigInt(id) },
    });
  }

  async getQuantityAtLocation(tenantId: string, locationId: string, productId: string) {
    const records = await this.prisma.inventory_on_hand.findMany({
      where: { tenant_id: tenantId, location_id: BigInt(locationId), product_id: BigInt(productId) },
    });
    return records.reduce((sum, r) => sum + Number(r.quantity_on_hand), 0);
  }

  /** Inventory aging report — join inventory_on_hand with inventory_lots */
  async getAgingReport(tenantId: string, facilityId?: string) {
    const where: any = { tenant_id: tenantId };
    if (facilityId) where.facility_id = BigInt(facilityId);

    const records = await this.prisma.inventory_on_hand.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    const lotIds = records.filter((r) => r.lot_id).map((r) => r.lot_id!);
    const lots = lotIds.length
      ? await this.prisma.inventory_lots.findMany({
          where: { lot_id: { in: lotIds } },
          select: { lot_id: true, lot_number: true, received_date: true, expiry_date: true },
        })
      : [];
    const lotMap = new Map(lots.map((l) => [l.lot_id.toString(), l]));

    const now = new Date();
    return records.map((r) => {
      const lot = r.lot_id ? lotMap.get(r.lot_id.toString()) : undefined;
      const receivedDate = lot?.received_date ?? null;
      return {
        on_hand_id: r.on_hand_id.toString(),
        product_id: r.product_id.toString(),
        location_id: r.location_id.toString(),
        lot_id: r.lot_id?.toString() ?? null,
        lot_number: lot?.lot_number ?? null,
        received_date: receivedDate,
        expiry_date: lot?.expiry_date ?? null,
        quantity_on_hand: Number(r.quantity_on_hand),
        days_in_warehouse: receivedDate
          ? Math.floor((now.getTime() - new Date(receivedDate).getTime()) / (1000 * 60 * 60 * 24))
          : null,
      };
    });
  }

  /** Aging summary grouped by days bucket */
  async getAgingSummary(tenantId: string, facilityId?: string) {
    const report = await this.getAgingReport(tenantId, facilityId);
    const buckets: Record<string, number> = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0,
    };

    for (const item of report) {
      const days = item.days_in_warehouse;
      if (days === null) continue;
      if (days <= 30) buckets['0-30'] += item.quantity_on_hand;
      else if (days <= 60) buckets['31-60'] += item.quantity_on_hand;
      else if (days <= 90) buckets['61-90'] += item.quantity_on_hand;
      else buckets['90+'] += item.quantity_on_hand;
    }

    return Object.entries(buckets).map(([bucket, quantity]) => ({ bucket, quantity }));
  }
}
