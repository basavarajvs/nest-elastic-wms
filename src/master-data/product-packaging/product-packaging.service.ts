import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductPackagingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.product_packaging_hierarchy.create({
      data: {
        tenant_id: tenantId,
        product_id: BigInt(dto.productId),
        parent_uom_id: BigInt(dto.parentUomId),
        child_uom_id: BigInt(dto.childUomId),
        quantity_per_parent: dto.quantityPerParent,
      },
      include: {
        units_of_measure_product_packaging_hierarchy_parent_uom_idTounits_of_measure: {
          select: { uom_code: true, uom_name: true },
        },
        units_of_measure_product_packaging_hierarchy_child_uom_idTounits_of_measure: {
          select: { uom_code: true, uom_name: true },
        },
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.productId) where.product_id = BigInt(query.productId);
    if (query.parentUomId) where.parent_uom_id = BigInt(query.parentUomId);
    const page = query.page || 1;
    const limit = query.limit || 20;
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
    return { data, total, page, limit };
  }

  async findById(tenantId: string, hierarchyId: bigint) {
    return this.prisma.product_packaging_hierarchy.findFirst({
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
  }

  async delete(tenantId: string, hierarchyId: bigint) {
    return this.prisma.product_packaging_hierarchy.deleteMany({
      where: { tenant_id: tenantId, hierarchy_id: hierarchyId },
    });
  }

  async update(tenantId: string, hierarchyId: bigint, dto: any) {
    const data: any = {};
    if (dto.parentUomId !== undefined) data.parent_uom_id = BigInt(dto.parentUomId);
    if (dto.childUomId !== undefined) data.child_uom_id = BigInt(dto.childUomId);
    if (dto.quantityPerParent !== undefined) data.quantity_per_parent = dto.quantityPerParent;
    return this.prisma.product_packaging_hierarchy.updateMany({
      where: { tenant_id: tenantId, hierarchy_id: hierarchyId },
      data,
    });
  }
}
