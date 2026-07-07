import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AllocationService {
  private readonly logger = new Logger(AllocationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const { allocated_for_reference_id, product_id, facility_id, lot_id, location_id, item_id, uom_id, ...rest } = dto;
    const created = await this.prisma.inventory_allocations.create({
      data: {
        tenant_id: tenantId,
        ...(allocated_for_reference_id !== undefined ? { allocated_for_reference_id: BigInt(allocated_for_reference_id) } : {}),
        ...(product_id !== undefined ? { product_id: BigInt(product_id) } : {}),
        ...(facility_id !== undefined ? { facility_id: BigInt(facility_id) } : {}),
        ...(lot_id !== undefined ? { lot_id: BigInt(lot_id) } : {}),
        ...(location_id !== undefined ? { location_id: BigInt(location_id) } : {}),
        ...(item_id !== undefined ? { item_id: BigInt(item_id) } : {}),
        ...(uom_id !== undefined ? { uom_id: BigInt(uom_id) } : {}),
        ...rest,
      },
      include: { warehouse_facilities: true, units_of_measure: true },
    });
    const mapped = await this.mapAllocations(tenantId, [created]);
    return mapped[0] || created;
  }

  async findAll(tenantId: string, query: any) {
    const { orderId, productId, facilityId } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const where: any = { tenant_id: tenantId };
    if (orderId) where.allocated_for_reference_id = BigInt(orderId);
    if (productId) where.product_id = BigInt(productId);
    if (facilityId) where.facility_id = BigInt(facilityId);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.inventory_allocations.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { warehouse_facilities: true, units_of_measure: true },
      }),
      this.prisma.inventory_allocations.count({ where }),
    ]);
    return { data: await this.mapAllocations(tenantId, data), total, page, limit };
  }

  async delete(tenantId: string, id: bigint) {
    const entity = await this.prisma.inventory_allocations.findFirst({
      where: { tenant_id: tenantId, allocation_id: id },
      include: { warehouse_facilities: true, units_of_measure: true },
    });
    await this.prisma.inventory_allocations.deleteMany({
      where: { tenant_id: tenantId, allocation_id: id },
    });
    if (!entity) return null;
    const mapped = await this.mapAllocations(tenantId, [entity]);
    return mapped[0] || entity;
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
    const { facilityId } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const where: any = { tenant_id: tenantId };
    if (facilityId) where.facility_id = BigInt(facilityId);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.inventory_allocation_rules.findMany({
        where,
        skip,
        take: limit,
        include: { inventory_allocation_rule_constraints: true, inventory_allocation_rule_locations: true },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.inventory_allocation_rules.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createRule(tenantId: string, dto: any) {
    const { facility_id, client_id, product_category_id, ...rest } = dto;
    return this.prisma.inventory_allocation_rules.create({
      data: {
        tenant_id: tenantId,
        ...(facility_id !== undefined ? { facility_id: BigInt(facility_id) } : {}),
        ...(client_id !== undefined ? { client_id: BigInt(client_id) } : {}),
        ...(product_category_id !== undefined ? { product_category_id: BigInt(product_category_id) } : {}),
        ...rest,
      },
    });
  }

  async updateRule(tenantId: string, id: string, dto: any) {
    const { facility_id, client_id, product_category_id, ...rest } = dto;
    return this.prisma.inventory_allocation_rules.update({
      where: { rule_id: BigInt(id) },
      data: {
        ...(facility_id !== undefined ? { facility_id: BigInt(facility_id) } : {}),
        ...(client_id !== undefined ? { client_id: BigInt(client_id) } : {}),
        ...(product_category_id !== undefined ? { product_category_id: BigInt(product_category_id) } : {}),
        ...rest,
      },
    });
  }

  private async mapAllocations(tenantId: string, data: any[]) {
    const productIds = [...new Set(data.map(d => d.product_id).filter(Boolean))];
    const lotIds = [...new Set(data.map(d => d.lot_id).filter(Boolean))];
    const locationIds = [...new Set(data.map(d => d.location_id).filter(Boolean))];

    const [products, lots, locations] = await Promise.all([
      productIds.length ? this.prisma.products.findMany({ where: { tenant_id: tenantId, product_id: { in: productIds } }, select: { product_id: true, product_name: true } }) : Promise.resolve([]),
      lotIds.length ? this.prisma.inventory_lots.findMany({ where: { tenant_id: tenantId, lot_id: { in: lotIds } }, select: { lot_id: true, lot_number: true } }) : Promise.resolve([]),
      locationIds.length ? this.prisma.storage_locations.findMany({ where: { tenant_id: tenantId, location_id: { in: locationIds } }, select: { location_id: true, location_name: true } }) : Promise.resolve([]),
    ]);

    const productMap = new Map<bigint, string>(); (products as any[]).forEach((p: any) => productMap.set(p.product_id, p.product_name));
    const lotMap = new Map<bigint, string>(); (lots as any[]).forEach((l: any) => lotMap.set(l.lot_id, l.lot_number));
    const locationMap = new Map<bigint, string>(); (locations as any[]).forEach((l: any) => locationMap.set(l.location_id, l.location_name));

    return data.map(d => ({
      ...d,
      facility_name: d.warehouse_facilities?.facility_name,
      product_name: productMap.get(d.product_id),
      lot_number: lotMap.get(d.lot_id),
      location_name: locationMap.get(d.location_id),
      warehouse_facilities: undefined,
      units_of_measure: undefined,
    }));
  }
}
