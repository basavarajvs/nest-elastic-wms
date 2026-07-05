import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LotService {
  constructor(private readonly prisma: PrismaService) {}

  async delete(tenantId: string, id: bigint) {
    return this.prisma.inventory_lots.deleteMany({
      where: { tenant_id: tenantId, lot_id: id },
    });
  }

  async create(tenantId: string, dto: any) {
    const { facilityId, productId, lotNumber: lot_number, ...rest } = dto;
    return this.prisma.inventory_lots.create({
      data: {
        tenant_id: tenantId,
        facility_id: facilityId ? BigInt(facilityId) : undefined,
        product_id: productId ? BigInt(productId) : undefined,
        lot_number,
        ...rest,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const { productId, facilityId, page = 1, limit = 50 } = query;
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
      }),
      this.prisma.inventory_lots.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: string) {
    return this.prisma.inventory_lots.findFirst({
      where: { tenant_id: tenantId, lot_id: BigInt(id) },
    });
  }

  async update(tenantId: string, id: string, dto: any) {
    await this.findById(tenantId, id);
    const { facilityId, productId, lotNumber, ...rest } = dto;
    return this.prisma.inventory_lots.update({
      where: { lot_id: BigInt(id) },
      data: {
        ...(facilityId !== undefined ? { facility_id: BigInt(facilityId) } : {}),
        ...(productId !== undefined ? { product_id: BigInt(productId) } : {}),
        ...(lotNumber !== undefined ? { lot_number: lotNumber } : {}),
        ...rest,
      },
    });
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
