import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AllocationService {
  private readonly logger = new Logger(AllocationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const { orderId, productId, facilityId, lotId, locationId, ...rest } = dto;
    return this.prisma.inventory_allocations.create({
      data: {
        tenant_id: tenantId,
        ...(orderId !== undefined ? { allocated_for_reference_id: BigInt(orderId) } : {}),
        ...(productId !== undefined ? { product_id: BigInt(productId) } : {}),
        ...(facilityId !== undefined ? { facility_id: BigInt(facilityId) } : {}),
        ...(lotId !== undefined ? { lot_id: BigInt(lotId) } : {}),
        ...(locationId !== undefined ? { location_id: BigInt(locationId) } : {}),
        ...rest,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const { orderId, productId, facilityId, page = 1, limit = 50 } = query;
    const where: any = { tenant_id: tenantId };
    if (orderId) where.allocated_for_reference_id = BigInt(orderId);
    if (productId) where.product_id = BigInt(productId);
    if (facilityId) where.facility_id = BigInt(facilityId);
    const skip = (page - 1) * Number(limit);
    const [data, total] = await Promise.all([
      this.prisma.inventory_allocations.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.inventory_allocations.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async delete(tenantId: string, id: bigint) {
    return this.prisma.inventory_allocations.deleteMany({
      where: { tenant_id: tenantId, allocation_id: id },
    });
  }

  /** FIFO lot allocation engine: picks oldest-received lots first */
  async allocateFifo(
    tenantId: string,
    productId: bigint,
    facilityId: bigint,
    quantityNeeded: number,
  ): Promise<any[]> {
    const lots = await this.prisma.inventory_lots.findMany({
      where: {
        tenant_id: tenantId,
        product_id: productId,
        status: 'AVAILABLE',
      },
      orderBy: [
        { received_date: 'asc' },
        { expiry_date: 'asc' },
      ] as any,
    });

    if (lots.length === 0) {
      throw new BadRequestException(`No active lots found for product ${productId}`);
    }

    const allocations: any[] = [];
    let remaining = quantityNeeded;

    for (const lot of lots) {
      if (remaining <= 0) break;

      const onHandRecords = await this.prisma.inventory_on_hand.findMany({
        where: {
          tenant_id: tenantId,
          product_id: productId,
          lot_id: lot.lot_id,
          facility_id: facilityId,
        },
      });

      const available = onHandRecords.reduce((s, r) => s + Number(r.quantity_on_hand || 0), 0);
      if (available <= 0) continue;

      const take = Math.min(available, remaining);

      allocations.push({
        lot,
        lotId: lot.lot_id,
        lotNumber: lot.lot_number,
        receivedDate: lot.received_date,
        expiryDate: lot.expiry_date,
        quantityAllocated: take,
        availableBefore: available,
        availableAfter: available - take,
      });

      remaining -= take;
    }

    if (remaining > 0) {
      this.logger.warn(`Short allocation: product ${productId} needs ${quantityNeeded}, allocated ${quantityNeeded - remaining}`);
    }

    return allocations;
  }

  /** Reserve inventory: decrement on-hand, create allocation record with FIFO */
  async reserveAndAllocate(
    tenantId: string,
    orderId: bigint,
    productId: bigint,
    facilityId: bigint,
    quantity: number,
    userId?: string,
  ) {
    const fifoAllocations = await this.allocateFifo(tenantId, productId, facilityId, quantity);

    const results: any[] = [];
    for (const alloc of fifoAllocations) {
      const onHandRecords = await this.prisma.inventory_on_hand.findMany({
        where: {
          tenant_id: tenantId,
          product_id: productId,
          lot_id: alloc.lotId,
          facility_id: facilityId,
        },
      });

      for (const onHand of onHandRecords) {
        const currentQty = Number(onHand.quantity_on_hand || 0);
        if (currentQty <= 0) continue;
        const take = Math.min(currentQty, alloc.quantityAllocated);
        const remaining = currentQty - take;

        await this.prisma.inventory_on_hand.update({
          where: { on_hand_id: onHand.on_hand_id },
          data: { quantity_on_hand: remaining },
        });

        const allocation = await this.prisma.inventory_allocations.create({
          data: {
            tenant_id: tenantId,
            facility_id: facilityId,
            product_id: productId,
            lot_id: alloc.lotId,
            location_id: onHand.location_id,
            uom_id: Number(onHand.uom_id || 0),
            allocation_type: 'ORDER',
            allocated_for_reference_id: orderId,
            allocated_for_reference_type: 'SALES_ORDER',
            quantity_allocated: take,
            status: 'ACTIVE',
            created_by: userId || null,
          },
        });

        await this.prisma.inventory_transactions.create({
          data: {
            tenant_id: tenantId,
            facility_id: facilityId,
            product_id: productId,
            lot_id: alloc.lotId,
            from_location_id: onHand.location_id,
            to_location_id: null,
            uom_id: Number(onHand.uom_id || 0),
            transaction_type: 'ALLOCATION',
            quantity: -take,
            reference_type: 'SALES_ORDER',
            reference_id: orderId,
            performed_by_user_id: userId || null,
          },
        });

        results.push(allocation);
      }
    }

    return results;
  }

  async findRules(tenantId: string, query: any) {
    const { facilityId, page = 1, limit = 50 } = query;
    const where: any = { tenant_id: tenantId };
    if (facilityId) where.facility_id = BigInt(facilityId);
    const skip = (page - 1) * Number(limit);
    const [data, total] = await Promise.all([
      this.prisma.inventory_allocation_rules.findMany({
        where,
        skip,
        take: Number(limit),
        include: { inventory_allocation_rule_constraints: true, inventory_allocation_rule_locations: true },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.inventory_allocation_rules.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createRule(tenantId: string, dto: any) {
    const { facilityId, ...rest } = dto;
    return this.prisma.inventory_allocation_rules.create({
      data: {
        tenant_id: tenantId,
        ...(facilityId !== undefined ? { facility_id: BigInt(facilityId) } : {}),
        ...rest,
      },
    });
  }

  async updateRule(tenantId: string, id: string, dto: any) {
    const { facilityId, ...rest } = dto;
    return this.prisma.inventory_allocation_rules.update({
      where: { rule_id: BigInt(id) },
      data: {
        ...(facilityId !== undefined ? { facility_id: BigInt(facilityId) } : {}),
        ...rest,
      },
    });
  }
}
