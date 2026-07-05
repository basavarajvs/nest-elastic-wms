import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.product_categories.create({
      data: {
        tenant_id: tenantId,
        category_code: dto.categoryCode,
        category_name: dto.categoryName,
        parent_category_id: dto.parentCategoryId ? BigInt(dto.parentCategoryId) : null,
        is_active: dto.isActive ?? true,
      },
    });
  }

  async findAll(tenantId: string) {
    const categories = await this.prisma.product_categories.findMany({
      where: { tenant_id: tenantId },
      orderBy: { category_name: 'asc' },
    });
    return {
      categories,
      tree: this.buildTree(categories),
    };
  }

  async findById(tenantId: string, categoryId: bigint) {
    const category = await this.prisma.product_categories.findFirst({
      where: { tenant_id: tenantId, category_id: categoryId },
    });
    if (!category) return null;
    const children = await this.prisma.product_categories.findMany({
      where: { tenant_id: tenantId, parent_category_id: categoryId },
    });
    return { ...category, children };
  }

  async delete(tenantId: string, categoryId: bigint) {
    return this.prisma.product_categories.deleteMany({
      where: { tenant_id: tenantId, category_id: categoryId },
    });
  }

  async update(tenantId: string, categoryId: bigint, dto: any) {
    return this.prisma.product_categories.updateMany({
      where: { tenant_id: tenantId, category_id: categoryId },
      data: {
        category_code: dto.categoryCode,
        category_name: dto.categoryName,
        parent_category_id: dto.parentCategoryId ? BigInt(dto.parentCategoryId) : null,
        is_active: dto.isActive,
      },
    });
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
