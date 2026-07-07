import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async delete(tenantId: string, id: bigint) {
    const entity = await this.prisma.inventory_transactions.findFirst({
      where: { tenant_id: tenantId, transaction_id: id },
    });
    await this.prisma.inventory_transactions.deleteMany({
      where: { tenant_id: tenantId, transaction_id: id },
    });
    return entity;
  }

  async findAll(tenantId: string, query: any) {
    const { productId, locationId, lotId, lpnId, transactionType, facilityId } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId };
    if (productId) where.product_id = BigInt(productId);
    if (locationId) where.from_location_id = BigInt(locationId);
    if (lotId) where.lot_id = BigInt(lotId);
    if (transactionType) where.transaction_type = transactionType;
    if (facilityId) where.facility_id = BigInt(facilityId);
    const [data, total] = await Promise.all([
      this.prisma.inventory_transactions.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { warehouse_facilities: true, units_of_measure: true },
      }),
      this.prisma.inventory_transactions.count({ where }),
    ]);
    return { data: await this.mapTransactions(tenantId, data), total, page, limit };
  }

  async findById(tenantId: string, id: string) {
    const record = await this.prisma.inventory_transactions.findFirst({
      where: { tenant_id: tenantId, transaction_id: BigInt(id) },
      include: { warehouse_facilities: true, units_of_measure: true },
    });
    if (!record) return null;
    const mapped = await this.mapTransactions(tenantId, [record]);
    return mapped[0] || null;
  }

  /** Web: Execute an inventory transaction and update on-hand quantities */
  async executeTransaction(tenantId: string, dto: any) {
    const { userId, from_location_id, to_location_id, lot_id, quantity, facility_id, product_id, ...rest } = dto;

    const bigIntFields = ['reference_id', 'item_id', 'owner_client_id', 'reference_line_number'] as const;
    const data: any = {
      tenant_id: tenantId,
      facility_id: BigInt(facility_id),
      product_id: BigInt(product_id),
      reference_type: dto.reference_type ?? 'MANUAL',
      transaction_status: 'COMPLETED',
      performed_by_user_id: userId,
      from_location_id: from_location_id ? BigInt(from_location_id) : undefined,
      to_location_id: to_location_id ? BigInt(to_location_id) : undefined,
      lot_id: lot_id ? BigInt(lot_id) : undefined,
      quantity,
      ...rest,
    };
    for (const field of bigIntFields) {
      if (data[field] !== undefined && data[field] !== null) {
        data[field] = BigInt(data[field]);
      }
    }

    const txn = await this.prisma.inventory_transactions.create({ data });

    // Decrement source location
    if (from_location_id) {
      const srcWhere: any = {
        tenant_id: tenantId,
        facility_id: BigInt(facility_id),
        product_id: BigInt(product_id),
        location_id: BigInt(from_location_id),
      };
      if (lot_id) srcWhere.lot_id = BigInt(lot_id);
      else srcWhere.lot_id = null;
      await this.prisma.inventory_on_hand.updateMany({
        where: srcWhere,
        data: { quantity_on_hand: { decrement: quantity } },
      });
    }

    // Increment destination location
    if (to_location_id) {
      const destWhere: any = {
        tenant_id: tenantId,
        facility_id: BigInt(facility_id),
        product_id: BigInt(product_id),
        location_id: BigInt(to_location_id),
      };
      if (lot_id) destWhere.lot_id = BigInt(lot_id);
      else destWhere.lot_id = null;
      const existing = await this.prisma.inventory_on_hand.findFirst({
        where: destWhere,
      });

      if (existing) {
        await this.prisma.inventory_on_hand.updateMany({
          where: { on_hand_id: existing.on_hand_id },
          data: { quantity_on_hand: { increment: quantity } },
        });
      } else {
        await this.prisma.inventory_on_hand.create({
          data: {
            tenant_id: tenantId,
            facility_id: BigInt(facility_id),
            product_id: BigInt(product_id),
            location_id: BigInt(to_location_id),
            lot_id: lot_id ? BigInt(lot_id) : undefined,
            quantity_on_hand: quantity,
            uom_id: dto.uom_id ?? 1,
          },
        });
      }
    }

    const mapped = await this.mapTransactions(tenantId, [txn]);
    return mapped[0] || txn;
  }

  private async mapTransactions(tenantId: string, data: any[]) {
    const productIds = [...new Set(data.map(d => d.product_id).filter(Boolean))];
    const lotIds = [...new Set(data.map(d => d.lot_id).filter(Boolean))];
    const fromLocIds = [...new Set(data.map(d => d.from_location_id).filter(Boolean))];
    const toLocIds = [...new Set(data.map(d => d.to_location_id).filter(Boolean))];

    const [products, lots, fromLocs, toLocs] = await Promise.all([
      productIds.length ? this.prisma.products.findMany({ where: { tenant_id: tenantId, product_id: { in: productIds } }, select: { product_id: true, product_name: true } }) : Promise.resolve([]),
      lotIds.length ? this.prisma.inventory_lots.findMany({ where: { tenant_id: tenantId, lot_id: { in: lotIds } }, select: { lot_id: true, lot_number: true } }) : Promise.resolve([]),
      fromLocIds.length ? this.prisma.storage_locations.findMany({ where: { tenant_id: tenantId, location_id: { in: fromLocIds } }, select: { location_id: true, location_name: true } }) : Promise.resolve([]),
      toLocIds.length ? this.prisma.storage_locations.findMany({ where: { tenant_id: tenantId, location_id: { in: toLocIds } }, select: { location_id: true, location_name: true } }) : Promise.resolve([]),
    ]);

    const productMap = new Map<bigint, string>(); (products as any[]).forEach((p: any) => productMap.set(p.product_id, p.product_name));
    const lotMap = new Map<bigint, string>(); (lots as any[]).forEach((l: any) => lotMap.set(l.lot_id, l.lot_number));
    const fromLocMap = new Map<bigint, string>(); (fromLocs as any[]).forEach((l: any) => fromLocMap.set(l.location_id, l.location_name));
    const toLocMap = new Map<bigint, string>(); (toLocs as any[]).forEach((l: any) => toLocMap.set(l.location_id, l.location_name));

    return data.map(d => ({
      ...d,
      facility_name: d.warehouse_facilities?.facility_name,
      product_name: productMap.get(d.product_id),
      lot_number: lotMap.get(d.lot_id),
      from_location_name: fromLocMap.get(d.from_location_id),
      to_location_name: toLocMap.get(d.to_location_id),
      uom_name: d.units_of_measure?.uom_name,
      warehouse_facilities: undefined,
      units_of_measure: undefined,
    }));
  }
}
