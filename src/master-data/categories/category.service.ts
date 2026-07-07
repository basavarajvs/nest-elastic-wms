import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const data: any = {
      tenant_id: tenantId,
      category_code: dto.category_code,
      category_name: dto.category_name,
    };
    if (dto.parent_category_id !== undefined) data.parent_category_id = BigInt(dto.parent_category_id);
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    const category = await this.prisma.product_categories.create({ data });
    return this.findById(tenantId, category.category_id);
  }

  async findAll(tenantId: string) {
    const categories = await this.prisma.product_categories.findMany({
      where: { tenant_id: tenantId },
      orderBy: { category_name: 'asc' },
      include: {
        product_categories: { select: { category_name: true } },
      },
    });
    return {
      categories: categories.map((c) => ({
        ...c,
        parent_category_name: c.product_categories?.category_name,
        product_categories: undefined,
      })),
      tree: this.buildTree(categories),
    };
  }

  async findById(tenantId: string, categoryId: bigint) {
    const category = await this.prisma.product_categories.findFirst({
      where: { tenant_id: tenantId, category_id: categoryId },
      include: {
        product_categories: { select: { category_name: true } },
      },
    });
    if (!category) return null;
    const children = await this.prisma.product_categories.findMany({
      where: { tenant_id: tenantId, parent_category_id: categoryId },
    });
    return {
      ...category,
      parent_category_name: category.product_categories?.category_name,
      product_categories: undefined,
      children,
    };
  }

  async delete(tenantId: string, categoryId: bigint) {
    const record = await this.findById(tenantId, categoryId);
    await this.prisma.product_categories.deleteMany({
      where: { tenant_id: tenantId, category_id: categoryId },
    });
    return record;
  }

  async update(tenantId: string, categoryId: bigint, dto: any) {
    const data: any = {};
    if (dto.category_code !== undefined) data.category_code = dto.category_code;
    if (dto.category_name !== undefined) data.category_name = dto.category_name;
    if (dto.parent_category_id !== undefined) data.parent_category_id = dto.parent_category_id ? BigInt(dto.parent_category_id) : null;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    await this.prisma.product_categories.updateMany({
      where: { tenant_id: tenantId, category_id: categoryId },
      data,
    });
    return this.findById(tenantId, categoryId);
  }

  private buildTree(categories: any[], parentId: bigint | null = null): any[] {
    return categories
      .filter((c) => c.parent_category_id === parentId)
      .map((c) => ({
        ...c,
        children: this.buildTree(categories, c.category_id),
      }));
  }
}
