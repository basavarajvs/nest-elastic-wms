import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OnHandService {
  constructor(private readonly prisma: PrismaService) {}

  async delete(tenantId: string, id: bigint) {
    const entity = await this.prisma.inventory_on_hand.findFirst({
      where: { tenant_id: tenantId, on_hand_id: id },
    });
    await this.prisma.inventory_on_hand.deleteMany({
      where: { tenant_id: tenantId, on_hand_id: id },
    });
    return entity;
  }

  async findAll(tenantId: string, query: any) {
    const { locationId, productId, lotId, facilityId } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
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
        include: { warehouse_facilities: true, units_of_measure: true },
      }),
      this.prisma.inventory_on_hand.count({ where }),
    ]);
    const productIds = [...new Set(data.map(r => r.product_id))];
    const locationIds = [...new Set(data.map(r => r.location_id))];
    const lotIds = [...new Set(data.filter(r => r.lot_id).map(r => r.lot_id!))];
    const [products, locations, lots] = await Promise.all([
      productIds.length ? this.prisma.products.findMany({ where: { product_id: { in: productIds } }, select: { product_id: true, product_name: true } }) : [],
      locationIds.length ? this.prisma.storage_locations.findMany({ where: { tenant_id: tenantId, location_id: { in: locationIds } }, select: { location_id: true, location_name: true } }) : [],
      lotIds.length ? this.prisma.inventory_lots.findMany({ where: { lot_id: { in: lotIds } }, select: { lot_id: true, lot_number: true } }) : [],
    ]);
    const productMap = new Map<string, string>(products.map(p => [p.product_id.toString(), p.product_name] as [string, string]));
    const locationMap = new Map<string, string>(locations.map(l => [l.location_id.toString(), l.location_name] as [string, string]));
    const lotMap = new Map<string, string>(lots.map(l => [l.lot_id.toString(), l.lot_number] as [string, string]));
    const mappedData = data.map(r => {
      const { warehouse_facilities, units_of_measure, ...rest } = r as any;
      return {
        ...rest,
        product_name: productMap.get(r.product_id.toString()) ?? null,
        location_name: locationMap.get(r.location_id.toString()) ?? null,
        lot_number: r.lot_id ? lotMap.get(r.lot_id.toString()) ?? null : null,
        uom_name: units_of_measure?.uom_name ?? null,
      };
    });
    return { data: mappedData, total, page, limit };
  }

  async findById(tenantId: string, id: string) {
    const record = await this.prisma.inventory_on_hand.findFirst({
      where: { tenant_id: tenantId, on_hand_id: BigInt(id) },
      include: { warehouse_facilities: true, units_of_measure: true },
    });
    if (!record) return null;
    const [product, location, lot] = await Promise.all([
      this.prisma.products.findFirst({ where: { product_id: record.product_id }, select: { product_name: true } }),
      this.prisma.storage_locations.findFirst({ where: { tenant_id: tenantId, location_id: record.location_id }, select: { location_name: true } }),
      record.lot_id ? this.prisma.inventory_lots.findFirst({ where: { lot_id: record.lot_id }, select: { lot_number: true } }) : null,
    ]);
    const { warehouse_facilities, units_of_measure, ...rest } = record as any;
    return {
      ...rest,
      product_name: product?.product_name ?? null,
      location_name: location?.location_name ?? null,
      lot_number: lot?.lot_number ?? null,
      uom_name: units_of_measure?.uom_name ?? null,
    };
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

    const productIds = [...new Set(records.map(r => r.product_id))];
    const locationIds = [...new Set(records.map(r => r.location_id))];
    const lotIds = records.filter((r) => r.lot_id).map((r) => r.lot_id!);
    const [products, locations, lots] = await Promise.all([
      productIds.length ? this.prisma.products.findMany({ where: { product_id: { in: productIds } }, select: { product_id: true, product_name: true } }) : [],
      locationIds.length ? this.prisma.storage_locations.findMany({ where: { tenant_id: tenantId, location_id: { in: locationIds } }, select: { location_id: true, location_name: true } }) : [],
      lotIds.length
        ? this.prisma.inventory_lots.findMany({
            where: { lot_id: { in: lotIds } },
            select: { lot_id: true, lot_number: true, received_date: true, expiry_date: true },
          })
        : [],
    ]);
    const productMap = new Map<string, string>(products.map(p => [p.product_id.toString(), p.product_name] as [string, string]));
    const locationMap = new Map<string, string>(locations.map(l => [l.location_id.toString(), l.location_name] as [string, string]));
    const lotMap = new Map<string, any>(lots.map((l) => [l.lot_id.toString(), l] as [string, any]));

    const now = new Date();
    return records.map((r) => {
      const lot = r.lot_id ? lotMap.get(r.lot_id.toString()) : undefined;
      const receivedDate = lot?.received_date ?? null;
      return {
        on_hand_id: r.on_hand_id.toString(),
        product_id: r.product_id.toString(),
        product_name: productMap.get(r.product_id.toString()) ?? null,
        location_id: r.location_id.toString(),
        location_name: locationMap.get(r.location_id.toString()) ?? null,
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
