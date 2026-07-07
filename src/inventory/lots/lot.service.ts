import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LotService {
  constructor(private readonly prisma: PrismaService) {}

  async delete(tenantId: string, id: bigint) {
    const entity = await this.prisma.inventory_lots.findFirst({
      where: { tenant_id: tenantId, lot_id: id },
    });
    await this.prisma.inventory_lots.deleteMany({
      where: { tenant_id: tenantId, lot_id: id },
    });
    return entity;
  }

  async create(tenantId: string, dto: any) {
    const { facility_id, product_id, lot_number, owner_client_id, ...rest } = dto;
    const result = await this.prisma.inventory_lots.create({
      data: {
        tenant_id: tenantId,
        facility_id: facility_id ? BigInt(facility_id) : undefined,
        product_id: product_id ? BigInt(product_id) : undefined,
        lot_number,
        owner_client_id: owner_client_id ? BigInt(owner_client_id) : undefined,
        ...rest,
      },
    });
    return this.findById(tenantId, result.lot_id.toString());
  }

  async findAll(tenantId: string, query: any) {
    const { productId, facilityId } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId };
    if (productId) where.product_id = BigInt(productId);
    if (facilityId) where.facility_id = BigInt(facilityId);
    const [data, total] = await Promise.all([
      this.prisma.inventory_lots.findMany({
        where,
        skip,
        take: limit,
        orderBy: { received_date: 'desc' },
        include: { warehouse_facilities: true },
      }),
      this.prisma.inventory_lots.count({ where }),
    ]);
    const productIds = [...new Set(data.map(l => l.product_id))];
    const products = productIds.length
      ? await this.prisma.products.findMany({ where: { product_id: { in: productIds } }, select: { product_id: true, product_name: true } })
      : [];
    const productMap = new Map(products.map(p => [p.product_id.toString(), p.product_name]));
    const mappedData = data.map(l => {
      const { warehouse_facilities, ...rest } = l as any;
      return {
        ...rest,
        facility_name: warehouse_facilities?.facility_name ?? null,
        product_name: productMap.get(l.product_id.toString()) ?? null,
      };
    });
    return { data: mappedData, total, page, limit };
  }

  async findById(tenantId: string, id: string) {
    const lot = await this.prisma.inventory_lots.findFirst({
      where: { tenant_id: tenantId, lot_id: BigInt(id) },
      include: { warehouse_facilities: true },
    });
    if (!lot) return null;
    let product_name: string | null = null;
    if (lot.product_id) {
      const product = await this.prisma.products.findFirst({ where: { product_id: lot.product_id }, select: { product_name: true } });
      product_name = product?.product_name ?? null;
    }
    const { warehouse_facilities, ...rest } = lot as any;
    return { ...rest, facility_name: warehouse_facilities?.facility_name ?? null, product_name };
  }

  async update(tenantId: string, id: string, dto: any) {
    await this.findById(tenantId, id);
    const { facility_id, product_id, lot_number, owner_client_id, ...rest } = dto;
    await this.prisma.inventory_lots.update({
      where: { lot_id: BigInt(id) },
      data: {
        ...(facility_id !== undefined ? { facility_id: BigInt(facility_id) } : {}),
        ...(product_id !== undefined ? { product_id: BigInt(product_id) } : {}),
        ...(lot_number !== undefined ? { lot_number: lot_number } : {}),
        ...(owner_client_id !== undefined ? { owner_client_id: BigInt(owner_client_id) } : {}),
        ...rest,
      },
    });
    return this.findById(tenantId, id);
  }

  async findFifo(tenantId: string, productId: string, facilityId: string, quantity: number) {
    const lots = await this.prisma.inventory_lots.findMany({
      where: { tenant_id: tenantId, product_id: BigInt(productId), facility_id: BigInt(facilityId), status: 'AVAILABLE' as any },
      orderBy: [{ received_date: 'asc' }, { expiry_date: 'asc' }],
    });
    const result: any[] = [];
    let remaining = quantity;
    for (const lot of lots) {
      if (remaining <= 0) break;
      const onHand = await this.prisma.inventory_on_hand.findFirst({
        where: { tenant_id: tenantId, lot_id: lot.lot_id, product_id: BigInt(productId) },
      });
      const available = onHand ? Number(onHand.quantity_on_hand) : 0;
      if (available > 0) {
        const take = Math.min(available, remaining);
        result.push({ lot, quantity: take });
        remaining -= take;
      }
    }
    return result;
  }
}
