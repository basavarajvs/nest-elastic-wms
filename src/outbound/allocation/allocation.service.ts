import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AllocationService {
  private readonly logger = new Logger(AllocationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Allocate inventory for a sales order line using rule-based strategy.
   * 1. Find active allocation rules for the facility (ordered by priority)
   * 2. For each rule, fetch matching locations based on strategy
   * 3. Reserve inventory from matching locations
   * 4. Create allocation records and reservations
   */
  async deleteAllocation(tenantId: string, allocationId: bigint) {
    return this.prisma.inventory_allocations.deleteMany({
      where: { tenant_id: tenantId, allocation_id: allocationId },
    });
  }

  async allocateForLine(tenantId: string, facilityId: bigint, orderLineId: bigint, productId: bigint, quantity: number) {
    const line = await this.prisma.sales_order_lines.findFirst({
      where: { tenant_id: tenantId, line_id: orderLineId, order_id: undefined },
    });
    // Get the full line with its order
    const fullLine = await this.prisma.sales_order_lines.findFirst({
      where: { tenant_id: tenantId, line_id: orderLineId },
    });
    if (!fullLine) throw new BadRequestException('Order line not found');

    // Fetch on-hand inventory for this product across locations
    const onHandRecords = await this.prisma.inventory_on_hand.findMany({
      where: {
        tenant_id: tenantId,
        facility_id: facilityId,
        product_id: productId,
        quantity_on_hand: { gt: 0 },
      },
      orderBy: { quantity_on_hand: 'desc' },
    });

    if (!onHandRecords.length) {
      throw new BadRequestException('No on-hand inventory available for allocation');
    }

    // Check active allocation rules
    const rules = await this.prisma.inventory_allocation_rules.findMany({
      where: { tenant_id: tenantId, is_active: true },
      orderBy: { priority: 'asc' },
    });

    // Sort locations by strategy: prefer FIFO (by lot expiry), FEFO (by location), or rule-based location preference
    let sortedLocations = [...onHandRecords];

    for (const rule of rules) {
      if (rule.allocation_strategy === 'FEFO') {
        sortedLocations.sort((a, b) => Number(a.on_hand_id) - Number(b.on_hand_id));
        break;
      }
      if (rule.allocation_strategy === 'FIFO') {
        sortedLocations.sort((a, b) => Number(a.on_hand_id) - Number(b.on_hand_id));
        break;
      }
      if (rule.prefer_single_location) {
        // Prefer locations with enough to fulfill the full qty
        sortedLocations.sort((a, b) => Number(b.quantity_on_hand) - Number(a.quantity_on_hand));
      }
      if (rule.prefer_full_pallets && rule.allocation_strategy === 'FULL_PALLET') {
        sortedLocations = sortedLocations.filter((l) => Number(l.quantity_on_hand) >= quantity);
        if (!sortedLocations.length) {
          sortedLocations = [...onHandRecords]; // fallback
        }
      }
    }

    // If no rules match, default to highest-qty-first
    if (!rules.length) {
      sortedLocations.sort((a, b) => Number(b.quantity_on_hand) - Number(a.quantity_on_hand));
    }

    let remainingQty = quantity;
    const allocations: any[] = [];

    for (const record of sortedLocations) {
      if (remainingQty <= 0) break;

      const available = Number(record.quantity_on_hand);
      const toAllocate = Math.min(available, remainingQty);

      const allocation = await this.prisma.inventory_allocations.create({
        data: {
          tenant_id: tenantId,
          facility_id: facilityId,
          product_id: productId,
          location_id: record.location_id,
          quantity_allocated: toAllocate,
          uom_id: record.uom_id || 1,
          allocation_type: 'SALES_ORDER',
          allocated_for_reference_type: 'SALES_ORDER_LINE',
          allocated_for_reference_id: orderLineId,
          lot_id: record.lot_id,
          status: 'ALLOCATED',
        },
      });

      await this.prisma.inventory_reservations.create({
        data: {
          tenant_id: tenantId,
          facility_id: facilityId,
          product_id: productId,
          location_id: record.location_id,
          lot_id: record.lot_id,
          quantity_reserved: toAllocate,
          uom_id: record.uom_id || 1,
          reservation_type: 'SALES_ORDER',
          reserved_for_reference_type: 'SALES_ORDER_LINE',
          reserved_for_reference_id: orderLineId,
          status: 'ACTIVE',
        },
      });

      allocations.push(allocation);
      remainingQty -= toAllocate;
    }

    if (remainingQty > 0) {
      this.logger.warn(`Partial allocation for line ${orderLineId}: ${quantity - remainingQty}/${quantity} allocated`);
    }

    return {
      allocatedQty: quantity - remainingQty,
      requestedQty: quantity,
      shortQty: remainingQty,
      allocations,
    };
  }

  /**
   * Deallocate inventory: remove allocations and reservations for a reference.
   */
  async deallocate(tenantId: string, referenceType: string, referenceId: bigint) {
    await this.prisma.inventory_allocations.updateMany({
      where: { tenant_id: tenantId, allocated_for_reference_type: referenceType, allocated_for_reference_id: referenceId },
      data: { status: 'DEALLOCATED' },
    });
    await this.prisma.inventory_reservations.updateMany({
      where: { tenant_id: tenantId, reserved_for_reference_type: referenceType, reserved_for_reference_id: referenceId },
      data: { status: 'RELEASED' },
    });
    return { deallocated: true, referenceType, referenceId };
  }

  /**
   * Check if a sales order line has sufficient allocatable inventory.
   */
  async checkAvailability(tenantId: string, facilityId: bigint, productId: bigint, requiredQty: number) {
    const onHandTotal = await this.prisma.inventory_on_hand.aggregate({
      where: { tenant_id: tenantId, facility_id: facilityId, product_id: productId },
      _sum: { quantity_on_hand: true },
    });
    const reservedTotal = await this.prisma.inventory_reservations.aggregate({
      where: { tenant_id: tenantId, facility_id: facilityId, product_id: productId, status: 'ACTIVE' },
      _sum: { quantity_reserved: true },
    });
    const available = Number(onHandTotal._sum?.quantity_on_hand || 0) - Number(reservedTotal._sum?.quantity_reserved || 0);
    return {
      productId: productId.toString(),
      onHand: Number(onHandTotal._sum?.quantity_on_hand || 0),
      reserved: Number(reservedTotal._sum?.quantity_reserved || 0),
      available,
      sufficient: available >= requiredQty,
      shortQty: Math.max(0, requiredQty - available),
    };
  }

  /**
   * Allocate all lines for a sales order.
   */
  async allocateOrder(tenantId: string, facilityId: bigint, orderId: bigint) {
    const lines = await this.prisma.sales_order_lines.findMany({
      where: { tenant_id: tenantId, order_id: orderId },
    });
    if (!lines.length) throw new BadRequestException('Order has no lines');

    const results: any[] = [];
    let totalShort = 0;

    for (const line of lines) {
      try {
        const result = await this.allocateForLine(
          tenantId, facilityId, line.line_id, line.product_id, Number(line.requested_quantity),
        );
        results.push({ lineId: line.line_id, ...result });
        totalShort += result.shortQty;
      } catch (err: any) {
        this.logger.warn(`Allocation failed for line ${line.line_id}: ${err.message}`);
        results.push({ lineId: line.line_id, error: err.message, shortQty: Number(line.requested_quantity) });
        totalShort += Number(line.requested_quantity);
      }
    }

    // Update order status if all allocated
    if (totalShort === 0) {
      await this.prisma.sales_orders.updateMany({
        where: { tenant_id: tenantId, order_id: orderId },
        data: { status: 'ALLOCATED' },
      });
    }

    return { orderId: orderId.toString(), results, totalShort };
  }

  /** Web: Get allocations for a specific order */
  async findByOrderId(tenantId: string, orderId: string) {
    const orderLines = await this.prisma.sales_order_lines.findMany({
      where: { tenant_id: tenantId, order_id: BigInt(orderId) },
    });

    if (!orderLines.length) return [];

    const lineIds = orderLines.map((l) => l.line_id);

    const rows = await this.prisma.inventory_allocations.findMany({
      where: {
        tenant_id: tenantId,
        allocated_for_reference_type: 'SALES_ORDER_LINE',
        allocated_for_reference_id: { in: lineIds },
      },
      orderBy: { created_at: 'desc' },
      include: {
        warehouse_facilities: { select: { facility_name: true } },
      },
    });
    const facilityIds = [...new Set(rows.map(r => r.facility_id))];
    const productIds = [...new Set(rows.map(r => r.product_id))];
    const locationIds = [...new Set(rows.map(r => r.location_id))];
    const lotIds = [...new Set(rows.map(r => r.lot_id).filter(Boolean))] as bigint[];
    const [products, locations, lots] = await Promise.all([
      productIds.length ? this.prisma.products.findMany({ where: { tenant_id: tenantId, product_id: { in: productIds } } }) : Promise.resolve([]),
      locationIds.length ? this.prisma.storage_locations.findMany({ where: { tenant_id: tenantId, location_id: { in: locationIds } } }) : Promise.resolve([]),
      lotIds.length ? this.prisma.inventory_lots.findMany({ where: { tenant_id: tenantId, lot_id: { in: lotIds } } }) : Promise.resolve([]),
    ]) as [any[], any[], any[]];
    const prodMap = new Map<bigint, string>();
    products.forEach(p => prodMap.set(p.product_id, p.product_name));
    const locMap = new Map<bigint, string>();
    locations.forEach(l => locMap.set(l.location_id, l.location_name));
    const lotMap = new Map<bigint, string>();
    lots.forEach(l => lotMap.set(l.lot_id, l.lot_number));
    return rows.map((r: any) => {
      const { warehouse_facilities, ...rest } = r;
      return {
        ...rest,
        facility_name: warehouse_facilities?.facility_name,
        product_name: prodMap.get(r.product_id),
        location_name: locMap.get(r.location_id),
        lot_number: r.lot_id ? lotMap.get(r.lot_id) : undefined,
      };
    });
  }
}
