import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dtos/category.dto';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto, tenantId: string) {
    const existing = await (this.prisma as any).productCategory.findFirst({
      where: { tenantId, categoryCode: dto.categoryCode },
    });
    if (existing) throw new BadRequestException(`Category ${dto.categoryCode} already exists`);

    if (dto.parentId) {
      await this.validateCategoryCycle(null, dto.parentId, tenantId);
    }

    return (this.prisma as any).productCategory.create({
      data: { tenantId, categoryCode: dto.categoryCode, name: dto.name, parentId: dto.parentId || null },
    });
  }

  async findAll(tenantId: string) {
    return (this.prisma as any).productCategory.findMany({
      where: { tenantId },
      orderBy: { categoryCode: 'asc' },
    });
  }

  async findById(id: string, tenantId: string) {
    const cat = await (this.prisma as any).productCategory.findFirst({
      where: { id, tenantId },
      include: { parent: true, children: true },
    });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async update(id: string, tenantId: string, dto: UpdateCategoryDto) {
    const cat = await (this.prisma as any).productCategory.findFirst({ where: { id, tenantId } });
    if (!cat) throw new NotFoundException('Category not found');

    if (dto.parentId !== undefined) {
      await this.validateCategoryCycle(id, dto.parentId, tenantId);
    }

    return (this.prisma as any).productCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId || null }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async delete(id: string, tenantId: string) {
    const cat = await (this.prisma as any).productCategory.findFirst({ where: { id, tenantId } });
    if (!cat) throw new NotFoundException('Category not found');

    const childrenCount = await (this.prisma as any).productCategory.count({ where: { parentId: id } });
    if (childrenCount > 0) {
      throw new BadRequestException('Cannot delete category with child categories');
    }

    const productsCount = await (this.prisma as any).product.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      throw new BadRequestException(`Cannot delete category with ${productsCount} product(s) linked`);
    }

    await (this.prisma as any).productCategory.delete({ where: { id } });
  }

  async getCategoryTree(tenantId: string) {
    const allCategories = await (this.prisma as any).productCategory.findMany({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: { categoryCode: 'asc' },
    });

    const map = new Map<string, any>();
    const roots: any[] = [];

    for (const cat of allCategories) {
      map.set(cat.id, { ...cat, children: [], path: '' });
    }

    for (const [id, node] of map) {
      if (node.parentId && map.has(node.parentId)) {
        const parent = map.get(node.parentId);
        parent.children.push(node);
        node.path = parent.path ? `${parent.path}/${node.categoryCode}` : node.categoryCode;
      } else {
        node.path = node.categoryCode;
        roots.push(node);
      }
    }

    return roots;
  }

  private async validateCategoryCycle(categoryId: string | null, newParentId: string, tenantId: string): Promise<void> {
    if (categoryId === newParentId) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    const visited = new Set<string>();
    let currentId: string | null = newParentId;

    while (currentId) {
      if (currentId === categoryId) {
        throw new BadRequestException('Circular reference detected: new parent is a descendant of this category');
      }
      if (visited.has(currentId)) break;
      visited.add(currentId);

      const parent: { parentId: string | null } | null = await (this.prisma as any).productCategory.findFirst({
        where: { id: currentId, tenantId },
        select: { parentId: true },
      });
      currentId = parent?.parentId || null;
    }
  }
}
