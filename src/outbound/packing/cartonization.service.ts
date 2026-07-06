import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CartonizationService {
  private readonly logger = new Logger(CartonizationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async calculateCartons(tenantId: string, facilityId: bigint, orderId: bigint) {
    const orderLines = await this.prisma.sales_order_lines.findMany({
      where: { tenant_id: tenantId, order_id: orderId },
    });
    if (!orderLines.length) return { cartons: [] };

    const productIds = orderLines.map(l => l.product_id);
    const products = await this.prisma.products.findMany({
      where: { tenant_id: tenantId, product_id: { in: productIds } },
    });
    const productMap = new Map(products.map(p => [p.product_id, p]));

    const rules = await this.prisma.cartonization_rules.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, is_active: true },
      orderBy: { priority: 'asc' },
    });

    const items = orderLines.map(line => {
      const prod = productMap.get(line.product_id);
      return {
        productId: Number(line.product_id),
        quantity: Number(line.requested_quantity),
        weight: prod?.weight ? Number(prod.weight) : null,
        length: prod?.length ? Number(prod.length) : null,
        width: prod?.width ? Number(prod.width) : null,
        height: prod?.height ? Number(prod.height) : null,
      };
    });

    if (!rules.length) {
      const cartons = [{ cartonIndex: 1, totalCartons: 1, cartonTypeId: null, items }];
      return { cartons };
    }

    const primaryRule = rules[0];
    const conditions = (primaryRule.conditions_json as any) || {};
    const maxWeight = conditions.maxWeight ? Number(conditions.maxWeight) : null;
    const maxVolume = conditions.maxVolume ? Number(conditions.maxVolume) : null;
    const maxItems = conditions.maxItems ? Number(conditions.maxItems) : null;

    const cartons: any[] = [];
    let currentCarton: any = { items: [], totalWeight: 0, totalVolume: 0 };

    for (const item of items) {
      for (let i = 0; i < item.quantity; i++) {
        const singleItem = { productId: item.productId, quantity: 1, weight: item.weight ? item.weight / item.quantity : null };
        if (maxItems && currentCarton.items.length >= maxItems) {
          cartons.push({ cartonIndex: cartons.length + 1, totalCartons: 0, cartonTypeId: primaryRule.carton_type_id ? Number(primaryRule.carton_type_id) : null, items: currentCarton.items });
          currentCarton = { items: [], totalWeight: 0, totalVolume: 0 };
        }
        if (maxWeight && (currentCarton.totalWeight + (singleItem.weight || 0)) > maxWeight) {
          cartons.push({ cartonIndex: cartons.length + 1, totalCartons: 0, cartonTypeId: primaryRule.carton_type_id ? Number(primaryRule.carton_type_id) : null, items: currentCarton.items });
          currentCarton = { items: [], totalWeight: 0, totalVolume: 0 };
        }
        currentCarton.items.push(singleItem);
        currentCarton.totalWeight += singleItem.weight || 0;
      }
    }
    if (currentCarton.items.length) {
      cartons.push({ cartonIndex: cartons.length + 1, totalCartons: 0, cartonTypeId: primaryRule.carton_type_id ? Number(primaryRule.carton_type_id) : null, items: currentCarton.items });
    }

    const total = cartons.length;
    cartons.forEach(c => { c.totalCartons = total; });

    return { cartons };
  }

  async createCartonPlan(tenantId: string, facilityId: bigint, orderId: bigint, cartons: any[]) {
    await this.prisma.packing_carton_plan.deleteMany({
      where: { tenant_id: tenantId, facility_id: facilityId, order_id: orderId },
    });
    for (const c of cartons) {
      await this.prisma.packing_carton_plan.create({
        data: {
          tenant_id: tenantId, facility_id: facilityId, order_id: orderId,
          carton_index: c.cartonIndex, total_cartons: c.totalCartons,
          carton_type_id: c.cartonTypeId ? BigInt(c.cartonTypeId) : null,
          items_json: c.items, status: 'PLANNED',
        },
      });
    }
    return this.prisma.packing_carton_plan.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, order_id: orderId },
      orderBy: { carton_index: 'asc' },
    });
  }

  async getCartonPlan(tenantId: string, orderId: bigint) {
    return this.prisma.packing_carton_plan.findMany({
      where: { tenant_id: tenantId, order_id: orderId },
      orderBy: { carton_index: 'asc' },
    });
  }
}
