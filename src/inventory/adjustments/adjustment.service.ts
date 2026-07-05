import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdjustmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const { lines, facilityId, ...header } = dto;
    return this.prisma.$transaction(async (tx: any) => {
      const adjustment = await tx.inventory_adjustments.create({
        data: {
          tenant_id: tenantId,
          facility_id: facilityId ? BigInt(facilityId) : undefined,
          ...header,
        },
      });
      if (lines?.length) {
        await tx.inventory_adjustment_lines.createMany({
          data: lines.map((l: any) => {
            const { productId, locationId, lotId, ...rest } = l;
            return {
              tenant_id: tenantId,
              adjustment_id: adjustment.adjustment_id,
              ...(productId !== undefined ? { product_id: BigInt(productId) } : {}),
              ...(locationId !== undefined ? { location_id: BigInt(locationId) } : {}),
              ...(lotId !== undefined ? { lot_id: BigInt(lotId) } : {}),
              ...rest,
            };
          }),
        });
      }
      return tx.inventory_adjustments.findFirst({
        where: { tenant_id: tenantId, adjustment_id: adjustment.adjustment_id },
      });
    });
  }

  async findAll(tenantId: string, query: any) {
    const { status, facilityId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId };
    if (status) where.status = status;
    if (facilityId) where.facility_id = BigInt(facilityId);
    const [data, total] = await Promise.all([
      this.prisma.inventory_adjustments.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.inventory_adjustments.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: string) {
    return this.prisma.inventory_adjustments.findFirst({
      where: { tenant_id: tenantId, adjustment_id: BigInt(id) },
    });
  }

  async delete(tenantId: string, id: bigint) {
    return this.prisma.inventory_adjustments.deleteMany({
      where: { tenant_id: tenantId, adjustment_id: id },
    });
  }

  async approve(tenantId: string, id: string, userId: string) {
    const adj = await this.findById(tenantId, id);
    if (!adj) throw new Error('Adjustment not found');
    return this.prisma.inventory_adjustments.update({
      where: { adjustment_id: BigInt(id) },
      data: { status: 'APPROVED' as any, approved_by_user_id: userId, approved_date: new Date() },
    });
  }
}
