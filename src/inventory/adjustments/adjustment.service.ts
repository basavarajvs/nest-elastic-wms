import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryAdjustedEvent } from '../../events/definitions/inventory.events';

@Injectable()
export class AdjustmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(tenantId: string, dto: any) {
    const { lines, facility_id, ...header } = dto;
    return this.prisma.$transaction(async (tx: any) => {
      const headerData: any = { tenant_id: tenantId, facility_id: facility_id ? BigInt(facility_id) : undefined };
      if (header.reference_id) headerData.reference_id = BigInt(header.reference_id);
      if (header.requested_by_user_id) headerData.requested_by_user_id = header.requested_by_user_id;
      if (header.approved_by_user_id) headerData.approved_by_user_id = header.approved_by_user_id;
      if (header.executed_by_user_id) headerData.executed_by_user_id = header.executed_by_user_id;
      const adjustment = await tx.inventory_adjustments.create({
        data: { ...headerData, ...header },
      });
      if (lines?.length) {
        await tx.inventory_adjustment_lines.createMany({
          data: lines.map((l: any) => {
            const { product_id, location_id, lot_id, uom_id, ...rest } = l;
            return {
              tenant_id: tenantId,
              adjustment_id: adjustment.adjustment_id,
              ...(product_id !== undefined ? { product_id: BigInt(product_id) } : {}),
              ...(location_id !== undefined ? { location_id: BigInt(location_id) } : {}),
              ...(lot_id !== undefined ? { lot_id: BigInt(lot_id) } : {}),
              ...(uom_id !== undefined ? { uom_id: BigInt(uom_id) } : {}),
              ...rest,
            };
          }),
        });
      }
      const result = await tx.inventory_adjustments.findFirst({
        where: { tenant_id: tenantId, adjustment_id: adjustment.adjustment_id },
        include: { warehouse_facilities: true },
      });
      const { warehouse_facilities, ...rest } = result as any;
      return { ...rest, facility_name: warehouse_facilities?.facility_name ?? null };
    });
  }

  async findAll(tenantId: string, query: any) {
    const { status, facilityId } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
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
        include: { warehouse_facilities: true },
      }),
      this.prisma.inventory_adjustments.count({ where }),
    ]);
    const mappedData = data.map(a => {
      const { warehouse_facilities, ...rest } = a as any;
      return { ...rest, facility_name: warehouse_facilities?.facility_name ?? null };
    });
    return { data: mappedData, total, page, limit };
  }

  async findById(tenantId: string, id: string) {
    const adj = await this.prisma.inventory_adjustments.findFirst({
      where: { tenant_id: tenantId, adjustment_id: BigInt(id) },
      include: { warehouse_facilities: true },
    });
    if (!adj) return null;
    const { warehouse_facilities, ...rest } = adj as any;
    return { ...rest, facility_name: warehouse_facilities?.facility_name ?? null };
  }

  async delete(tenantId: string, id: bigint) {
    const entity = await this.prisma.inventory_adjustments.findFirst({
      where: { tenant_id: tenantId, adjustment_id: id },
    });
    await this.prisma.inventory_adjustments.deleteMany({
      where: { tenant_id: tenantId, adjustment_id: id },
    });
    return entity;
  }

  async approve(tenantId: string, id: string, userId: string) {
    const adj = await this.findById(tenantId, id);
    if (!adj) throw new Error('Adjustment not found');
    const result = await this.prisma.inventory_adjustments.update({
      where: { adjustment_id: BigInt(id) },
      data: { status: 'APPROVED' as any, approved_by_user_id: userId, approved_date: new Date() },
      include: { warehouse_facilities: true },
    });

    const firstLine = await this.prisma.inventory_adjustment_lines.findFirst({
      where: { tenant_id: tenantId, adjustment_id: BigInt(id) },
      orderBy: { adjustment_line_id: 'asc' },
    });

    this.eventEmitter.emit(
      'inventory.adjusted',
      new InventoryAdjustedEvent({
        tenant_id: tenantId,
        facility_id: result.facility_id,
        adjustment_id: BigInt(id),
        product_id: firstLine?.product_id || 0n,
        location_id: firstLine?.location_id || 0n,
        old_quantity: 0,
        new_quantity: Number(firstLine?.quantity_adjustment || 0),
        reason: adj.reason || adj.reason_code || undefined,
        approved_by: userId,
      }),
    );

    const { warehouse_facilities, ...rest } = result as any;
    return { ...rest, facility_name: warehouse_facilities?.facility_name ?? null };
  }
}
