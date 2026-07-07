import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductPackagingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const row = await this.prisma.product_packaging_hierarchy.create({
      data: {
        tenant_id: tenantId,
        product_id: BigInt(dto.product_id),
        parent_uom_id: BigInt(dto.parent_uom_id),
        child_uom_id: BigInt(dto.child_uom_id),
        quantity_per_parent: dto.quantity_per_parent,
      },
      include: {
        products: { select: { product_code: true, product_name: true } },
        units_of_measure_product_packaging_hierarchy_parent_uom_idTounits_of_measure: {
          select: { uom_code: true, uom_name: true },
        },
        units_of_measure_product_packaging_hierarchy_child_uom_idTounits_of_measure: {
          select: { uom_code: true, uom_name: true },
        },
      },
    });
    return this.mapPackagingRow(row);
  }

  private mapPackagingRow(r: any) {
    const { products, units_of_measure_product_packaging_hierarchy_parent_uom_idTounits_of_measure: parentUom, units_of_measure_product_packaging_hierarchy_child_uom_idTounits_of_measure: childUom, ...rest } = r;
    return {
      ...rest,
      product_name: products?.product_name,
      parent_uom_name: parentUom?.uom_name,
      child_uom_name: childUom?.uom_name,
    };
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.productId) where.product_id = BigInt(query.productId);
    if (query.parentUomId) where.parent_uom_id = BigInt(query.parentUomId);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.product_packaging_hierarchy.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { hierarchy_id: 'asc' },
        include: {
          products: { select: { product_code: true, product_name: true } },
          units_of_measure_product_packaging_hierarchy_parent_uom_idTounits_of_measure: {
            select: { uom_code: true, uom_name: true },
          },
          units_of_measure_product_packaging_hierarchy_child_uom_idTounits_of_measure: {
            select: { uom_code: true, uom_name: true },
          },
        },
      }),
      this.prisma.product_packaging_hierarchy.count({ where }),
    ]);
    return { data: data.map(this.mapPackagingRow), total, page, limit };
  }

  async findById(tenantId: string, hierarchyId: bigint) {
    const row = await this.prisma.product_packaging_hierarchy.findFirst({
      where: { tenant_id: tenantId, hierarchy_id: hierarchyId },
      include: {
        products: { select: { product_code: true, product_name: true } },
        units_of_measure_product_packaging_hierarchy_parent_uom_idTounits_of_measure: {
          select: { uom_code: true, uom_name: true },
        },
        units_of_measure_product_packaging_hierarchy_child_uom_idTounits_of_measure: {
          select: { uom_code: true, uom_name: true },
        },
      },
    });
    return row ? this.mapPackagingRow(row) : null;
  }

  async delete(tenantId: string, hierarchyId: bigint) {
    const record = await this.findById(tenantId, hierarchyId);
    await this.prisma.product_packaging_hierarchy.deleteMany({
      where: { tenant_id: tenantId, hierarchy_id: hierarchyId },
    });
    return record;
  }

  async update(tenantId: string, hierarchyId: bigint, dto: any) {
    const data: any = {};
    if (dto.parent_uom_id !== undefined) data.parent_uom_id = BigInt(dto.parent_uom_id);
    if (dto.child_uom_id !== undefined) data.child_uom_id = BigInt(dto.child_uom_id);
    if (dto.quantity_per_parent !== undefined) data.quantity_per_parent = dto.quantity_per_parent;
    await this.prisma.product_packaging_hierarchy.updateMany({
      where: { tenant_id: tenantId, hierarchy_id: hierarchyId },
      data,
    });
    return this.findById(tenantId, hierarchyId);
  }
}
