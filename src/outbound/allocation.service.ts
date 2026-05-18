import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AllocationOverrideDto } from './dtos/allocation.dto';

@Injectable()
export class AllocationService {
  private readonly logger = new Logger(AllocationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async softAllocate(orderId: string, tenantId: string): Promise<any[]> {
    const order = await (this.prisma as any).salesOrder.findFirst({
      where: { id: orderId, tenantId },
      include: { lines: true },
    });
    if (!order) throw new BadRequestException('Order not found');

    const allocations: any[] = [];
    for (const line of order.lines) {
      if (line.status !== 'ALLOCATED' && line.status !== 'CREATED') continue;

      const availableStock = await (this.prisma as any).$queryRawUnsafe(`
        SELECT
          ioh.id,
          ioh.product_id,
          ioh.location_id,
          ioh.lot_id,
          ioh.quantity_on_hand,
          ioh.quantity_allocated,
          ioh.quantity_reserved,
          ioh.uom_id,
          (ioh.quantity_on_hand - ioh.quantity_allocated - ioh.quantity_reserved) as available
        FROM multitenant.inventory_on_hand ioh
        WHERE ioh.tenant_id = $1::uuid
          AND ioh.facility_id = $2::uuid
          AND ioh.product_id = $3::uuid
          AND (ioh.quantity_on_hand - ioh.quantity_allocated - ioh.quantity_reserved) > 0
        ORDER BY ioh.created_at ASC
      `, tenantId, order.facilityId, line.productId);

      let remaining = line.requestedQuantity;
      for (const stock of availableStock) {
        if (remaining <= 0) break;
        const take = Math.min(Number(stock.available), remaining);
        const alloc = await (this.prisma as any).inventoryAllocation.create({
          data: {
            tenantId,
            facilityId: order.facilityId,
            productId: stock.product_id,
            lotId: stock.lot_id,
            locationId: stock.location_id,
            quantityAllocated: take,
            uomId: stock.uom_id,
            allocationType: 'SALES_ORDER_PICK',
            status: 'SOFT',
            orderId,
            orderLineId: line.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
        allocations.push(alloc);

        await (this.prisma as any).inventoryOnHand.updateMany({
          where: { id: stock.id, tenantId },
          data: { quantityAllocated: { increment: take } },
        });
        remaining -= take;
      }

      if (remaining <= 0) {
        await (this.prisma as any).salesOrderLine.update({
          where: { id: line.id },
          data: { status: 'ALLOCATED' },
        });
      }
    }

    this.eventEmitter.emit('allocation.soft_done', { orderId, allocations: allocations.length, tenantId });
    await this.syncOrderStatus(orderId, tenantId);
    return allocations;
  }

  async hardAllocate(orderId: string, tenantId: string): Promise<void> {
    const softAllocs = await (this.prisma as any).inventoryAllocation.findMany({
      where: { orderId, tenantId, status: 'SOFT' },
    });

    for (const alloc of softAllocs) {
      const onHand = await (this.prisma as any).inventoryOnHand.findFirst({
        where: {
          tenantId,
          locationId: alloc.locationId,
          lotId: alloc.lotId || '00000000-0000-0000-0000-000000000000',
          productId: alloc.productId,
        },
      });

      if (!onHand || (onHand.quantityOnHand - onHand.quantityAllocated - onHand.quantityReserved) < alloc.quantityAllocated) {
        throw new BadRequestException(`Insufficient stock for allocation ${alloc.id}`);
      }

      await (this.prisma as any).inventoryAllocation.update({
        where: { id: alloc.id },
        data: { status: 'HARD_ALLOCATED' },
      });
    }

    this.eventEmitter.emit('allocation.hard_locked', { orderId, count: softAllocs.length, tenantId });
  }

  async releaseAllocation(allocationId: string, tenantId: string): Promise<any> {
    const alloc = await (this.prisma as any).inventoryAllocation.findFirst({
      where: { id: allocationId, tenantId },
    });
    if (!alloc) throw new BadRequestException('Allocation not found');

    await (this.prisma as any).inventoryOnHand.updateMany({
      where: { tenantId, locationId: alloc.locationId, productId: alloc.productId },
      data: { quantityAllocated: { decrement: alloc.quantityAllocated } },
    });

    return (this.prisma as any).inventoryAllocation.update({
      where: { id: allocationId },
      data: { status: 'CANCELLED' },
    });
  }

  async overrideAllocation(dto: AllocationOverrideDto, tenantId: string): Promise<any> {
    return (this.prisma as any).$transaction(async (tx: any) => {
      const alloc = await tx.inventoryAllocation.findFirst({
        where: { id: dto.allocationId, tenantId },
      });
      if (!alloc) throw new BadRequestException('Allocation not found');

      await tx.inventoryOnHand.updateMany({
        where: { tenantId, locationId: alloc.locationId, productId: alloc.productId },
        data: { quantityAllocated: { decrement: alloc.quantityAllocated } },
      });

      const substituteLot = await tx.inventoryOnHand.findFirst({
        where: { tenantId, lotId: dto.substituteLotId, locationId: dto.substituteLocationId, productId: alloc.productId },
      });
      if (!substituteLot || (substituteLot.quantityOnHand - substituteLot.quantityAllocated) < alloc.quantityAllocated) {
        throw new BadRequestException('Substitute lot has insufficient stock');
      }

      await tx.inventoryOnHand.update({
        where: { id: substituteLot.id },
        data: { quantityAllocated: { increment: alloc.quantityAllocated } },
      });

      const updated = await tx.inventoryAllocation.update({
        where: { id: dto.allocationId },
        data: {
          lotId: dto.substituteLotId,
          locationId: dto.substituteLocationId,
          status: 'HARD_ALLOCATED',
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          tenantId,
          facilityId: alloc.facilityId,
          productId: alloc.productId,
          locationId: dto.substituteLocationId,
          lotId: dto.substituteLotId,
          transactionType: 'ADJUSTMENT_INCREASE',
          quantity: alloc.quantityAllocated,
          quantityBefore: substituteLot.quantityOnHand,
          quantityAfter: substituteLot.quantityOnHand,
          uomId: alloc.uomId,
          referenceType: 'ALLOCATION_OVERRIDE',
          referenceId: dto.allocationId,
          reasonCode: 'SUPERVISOR_OVERRIDE',
          metadata: { reason: dto.reason },
        },
      });

      this.eventEmitter.emit('allocation.override', { allocationId: dto.allocationId, reason: dto.reason, tenantId });
      return updated;
    });
  }

  async getPendingSoftAllocations(tenantId: string, facilityId?: string): Promise<any[]> {
    const where: any = { tenantId, status: 'SOFT' };
    if (facilityId) where.facilityId = facilityId;
    return (this.prisma as any).inventoryAllocation.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  private async syncOrderStatus(orderId: string, tenantId: string): Promise<void> {
    const lines = await (this.prisma as any).salesOrderLine.findMany({
      where: { orderId, tenantId },
    });
    const allAllocated = lines.every((l: any) => l.status === 'ALLOCATED');
    if (allAllocated) {
      await (this.prisma as any).salesOrder.update({
        where: { id: orderId },
        data: { status: 'ALLOCATED' },
      });
    }
  }
}
