import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComponentsService {
  private readonly logger = new Logger(ComponentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async enrichComponentRows(rows: any[]): Promise<any[]> {
    if (!rows.length) return rows;
    const tenantId = rows[0].tenant_id;
    const productIds = rows.map(c => c.component_product_id).filter(Boolean) as bigint[];
    let productMap = new Map<bigint, string>();
    if (productIds.length) {
      const products = await this.prisma.products.findMany({
        where: { tenant_id: tenantId, product_id: { in: productIds } },
        select: { product_id: true, product_name: true },
      });
      productMap = new Map(products.map(p => [p.product_id, p.product_name]));
    }
    return rows.map(r => ({
      ...r,
      product_name: productMap.get(r.component_product_id) || r.component_product_name,
    }));
  }

  private async enrichComponentRow(r: any): Promise<any> {
    if (!r) return r;
    const product = await this.prisma.products.findFirst({
      where: { tenant_id: r.tenant_id, product_id: r.component_product_id },
      select: { product_name: true },
    });
    return { ...r, product_name: product?.product_name || r.component_product_name };
  }

  async delete(tenantId: string, workOrderId: bigint, componentId: bigint) {
    const entity = await this.prisma.work_order_components.findFirst({
      where: { tenant_id: tenantId, work_order_id: workOrderId, component_id: componentId },
    });
    await this.prisma.work_order_components.deleteMany({
      where: { tenant_id: tenantId, work_order_id: workOrderId, component_id: componentId },
    });
    return this.enrichComponentRow(entity);
  }

  async findComponentsByWorkOrderId(tenantId: string, workOrderId: bigint) {
    const components = await this.prisma.work_order_components.findMany({
      where: { tenant_id: tenantId, work_order_id: workOrderId },
      orderBy: { component_id: 'asc' },
    });
    return this.enrichComponentRows(components);
  }

  async addComponent(tenantId: string, workOrderId: bigint, dto: any) {
    const row = await this.prisma.work_order_components.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        work_order_id: workOrderId,
        component_product_id: BigInt(dto.component_product_id),
        component_product_name: dto.component_product_name,
        component_product_code: dto.component_product_code,
        required_quantity: dto.required_quantity,
        total_required_quantity: dto.total_required_quantity,
        remaining_required_quantity: dto.remaining_required_quantity ?? dto.required_quantity,
        uom_id: BigInt(dto.uom_id),
        notes: dto.notes,
      },
    });
    return this.enrichComponentRow(row);
  }

  async reserveComponents(tenantId: string, workOrderId: bigint) {
    await this.prisma.work_order_components.updateMany({
      where: { tenant_id: tenantId, work_order_id: workOrderId, status: 'PENDING' },
      data: { status: 'RESERVED' },
    });
    const rows = await this.prisma.work_order_components.findMany({
      where: { tenant_id: tenantId, work_order_id: workOrderId },
    });
    return this.enrichComponentRows(rows);
  }
}
