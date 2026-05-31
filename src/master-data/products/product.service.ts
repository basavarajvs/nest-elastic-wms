import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { ProductFilterDto } from './dtos/product-filter.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BarcodeService } from './barcode.service';
import { AttributeService } from './attribute.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common/cache/redis.constants';

export enum ProductProjection {
  WEB = 'WEB',
  RF = 'RF',
}

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly barcodeService: BarcodeService,
    private readonly attributeService: AttributeService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async create(dto: CreateProductDto, tenantId: string) {
    // Challenge 3: Wrap quota check + create in a single transaction with optimistic concurrency
    return this.prisma.withTransaction(tenantId, async (tx: any) => {
      // Validate category
      const category = await tx.productCategory.findFirst({
        where: { id: dto.categoryId, tenantId },
      });
      if (!category) throw new BadRequestException('Category not found');

      // Validate UOM
      const uom = await tx.unitOfMeasure.findFirst({
        where: { id: dto.baseUomId, tenantId },
      });
      if (!uom) throw new BadRequestException('Unit of measure not found');

      // Check unique product code
      const existing = await tx.product.findFirst({
        where: { tenantId, productCode: dto.productCode },
      });
      if (existing) throw new BadRequestException(`Product code ${dto.productCode} already exists`);

      // Challenge 3: Optimistic quota check + increment in one atomic operation
      const quotaResult: any[] = await tx.$queryRawUnsafe(
        `UPDATE multitenant.resource_quotas
         SET current_usage = current_usage + 1, updated_at = NOW()
         WHERE tenant_id = $1::uuid AND resource_type = 'products'
           AND current_usage < limit_amount
         RETURNING true as updated`,
        tenantId,
      );

      const quotaUpdated = quotaResult?.[0]?.updated;
      if (!quotaUpdated) {
        // Check if quota exists and report the limit
        const quota = await tx.resourceQuota.findFirst({
          where: { tenantId, resourceType: 'products' },
          select: { limitAmount: true, currentUsage: true },
        });
        throw new BadRequestException(
          `Quota exceeded for products: ${quota?.currentUsage || 0}/${quota?.limitAmount || 0}`,
        );
      }

      // Create product
      const product = await tx.product.create({
        data: {
          tenantId,
          categoryId: dto.categoryId,
          baseUomId: dto.baseUomId,
          productCode: dto.productCode,
          name: dto.name,
          description: dto.description,
          trackLot: dto.trackLot ?? false,
          trackSerial: dto.trackSerial ?? false,
          trackExpiry: dto.trackExpiry ?? false,
          shelfLifeDays: dto.shelfLifeDays,
          velocityClass: dto.velocityClass,
        },
      });

      // Create barcodes
      const barcodeValues: string[] = [];
      if (dto.barcodes) {
        for (let i = 0; i < dto.barcodes.length; i++) {
          const b = dto.barcodes[i];
          if (!this.barcodeService.validateFormat(b.barcodeValue, b.type || 'CODE128')) {
            throw new BadRequestException(
              `Invalid barcode format for "${b.barcodeValue}" (type: ${b.type || 'CODE128'})`,
            );
          }
          await tx.productBarcode.create({
            data: {
              tenantId,
              productId: product.id,
              barcodeValue: b.barcodeValue,
              type: b.type || 'CODE128',
              isPrimary: b.isPrimary ?? (i === 0),
              quantityPerScan: b.quantityPerScan ?? 1,
              childUomCode: b.childUomCode,
            },
          });
          barcodeValues.push(b.barcodeValue);
        }
      }

      // Create attributes
      if (dto.attributes) {
        for (const attr of dto.attributes) {
          await tx.productAttribute.create({
            data: { tenantId, productId: product.id, key: attr.key, value: attr.value },
          });
        }
      }

      this.eventEmitter.emit('product.created', { id: product.id, tenantId, barcodes: barcodeValues });

      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          category: { select: { id: true, categoryCode: true, name: true } },
          baseUom: { select: { id: true, code: true, name: true } },
          barcodes: { where: { isActive: true } },
        },
      });
    });
  }

  async list(tenantId: string, filter: ProductFilterDto, projection: ProductProjection) {
    const where: Record<string, any> = { tenantId };
    if (filter.isActive !== undefined) where.isActive = filter.isActive;
    if (filter.categoryId) where.categoryId = filter.categoryId;
    if (filter.velocityClass) where.velocityClass = filter.velocityClass;
    if (filter.trackLot !== undefined) where.trackLot = filter.trackLot;
    if (filter.search) {
      where.OR = [
        { productCode: { contains: filter.search, mode: 'insensitive' } },
        { name: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const page = filter.page || 1;
    const limit = filter.limit || 50;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      (this.prisma as any).product.findMany({
        where,
        skip,
        take: limit,
        include: projection === ProductProjection.WEB
          ? {
              category: { select: { id: true, categoryCode: true, name: true } },
              baseUom: { select: { id: true, code: true, name: true } },
              barcodes: { where: { isActive: true }, select: { barcodeValue: true, type: true, isPrimary: true } },
              attributes: { where: { isActive: true }, select: { key: true, value: true } },
            }
          : {
              baseUom: { select: { code: true } },
            },
      }),
      (this.prisma as any).product.count({ where }),
    ]);

    if (projection === ProductProjection.RF) {
      return {
        items: items.map((p: any) => ({
          id: p.id,
          productCode: p.productCode,
          name: p.name,
          baseUomCode: p.baseUom?.code || 'EA',
          isActive: p.isActive,
          velocityClass: p.velocityClass,
        })),
        total,
        page,
        limit,
      };
    }

    return { items, total, page, limit };
  }

  async findById(id: string, tenantId: string, projection: ProductProjection = ProductProjection.WEB) {
    const product = await (this.prisma as any).product.findFirst({
      where: { id, tenantId },
      include: projection === ProductProjection.WEB
        ? {
            category: { select: { id: true, categoryCode: true, name: true } },
            baseUom: { select: { id: true, code: true, name: true } },
            barcodes: { where: { isActive: true } },
            attributes: { where: { isActive: true } },
          }
        : {
            baseUom: { select: { code: true } },
          },
    });

    if (!product) throw new NotFoundException('Product not found');

    if (projection === ProductProjection.RF) {
      return {
        id: product.id,
        productCode: product.productCode,
        name: product.name,
        baseUomCode: product.baseUom?.code || 'EA',
        isActive: product.isActive,
        velocityClass: product.velocityClass,
        trackLot: product.trackLot,
        trackSerial: product.trackSerial,
      };
    }

    return product;
  }

  async findByBarcode(barcodeValue: string, tenantId: string) {
    return this.barcodeService.lookupBarcode(barcodeValue, tenantId);
  }

  async update(id: string, dto: UpdateProductDto, tenantId: string) {
    const product = await (this.prisma as any).product.findFirst({
      where: { id, tenantId },
      include: { barcodes: { where: { isActive: true } } },
    });
    if (!product) throw new NotFoundException('Product not found');

    if (dto.categoryId && dto.categoryId !== product.categoryId) {
      await this.validateCategoryCycle(id, dto.categoryId, tenantId);
    }

    const updateData: Record<string, any> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    if (dto.baseUomId !== undefined) updateData.baseUomId = dto.baseUomId;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.trackLot !== undefined) updateData.trackLot = dto.trackLot;
    if (dto.trackSerial !== undefined) updateData.trackSerial = dto.trackSerial;
    if (dto.trackExpiry !== undefined) updateData.trackExpiry = dto.trackExpiry;
    if (dto.shelfLifeDays !== undefined) updateData.shelfLifeDays = dto.shelfLifeDays;
    if (dto.velocityClass !== undefined) updateData.velocityClass = dto.velocityClass;

    // Collect changed barcodes for cache invalidation
    const changedBarcodes: string[] = [];

    if (dto.barcodes) {
      for (const b of dto.barcodes) {
        if (b.barcodeValue) {
          const existingBarcode = product.barcodes?.find((pb: any) => pb.barcodeValue === b.barcodeValue);
          if (existingBarcode) {
            const bcUpdate: Record<string, any> = {};
            if (b.type !== undefined) bcUpdate.type = b.type;
            if (b.isPrimary !== undefined) bcUpdate.isPrimary = b.isPrimary;
            if (b.isActive !== undefined) bcUpdate.isActive = b.isActive;
            if (b.quantityPerScan !== undefined) bcUpdate.quantityPerScan = b.quantityPerScan;
            if (b.childUomCode !== undefined) bcUpdate.childUomCode = b.childUomCode;
            if (Object.keys(bcUpdate).length > 0) {
              await (this.prisma as any).productBarcode.updateMany({
                where: { id: existingBarcode.id, tenantId },
                data: bcUpdate,
              });
            }
            changedBarcodes.push(b.barcodeValue);
          }
        }
      }
    }

    if (dto.attributes) {
      for (const attr of dto.attributes) {
        await this.attributeService.upsert(product.id, attr.key, attr.value, tenantId);
      }
    }

    const updated = await (this.prisma as any).product.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, categoryCode: true, name: true } },
        baseUom: { select: { id: true, code: true, name: true } },
        barcodes: { where: { isActive: true } },
      },
    });

    this.eventEmitter.emit('product.updated', {
      id: product.id,
      tenantId,
      barcodes: changedBarcodes,
    });

    return updated;
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    await this.prisma.withTransaction(tenantId, async (tx: any) => {
      const product = await tx.product.findFirst({ where: { id, tenantId } });
      if (!product) throw new NotFoundException('Product not found');

      await tx.product.update({
        where: { id },
        data: { isActive: false },
      });

      // Decrement quota
      await tx.$executeRawUnsafe(
        `UPDATE multitenant.resource_quotas
         SET current_usage = GREATEST(0, current_usage - 1), updated_at = NOW()
         WHERE tenant_id = $1::uuid AND resource_type = 'products'`,
        tenantId,
      );
    });

    this.eventEmitter.emit('product.deleted', { id, tenantId });
  }

  // Challenge 6: CategoryTreeBuilder — single query + Map grouping
  async getCategoryTree(tenantId: string) {
    const cacheKey = `prod:category:tree:${tenantId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

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

    await this.redis.setex(cacheKey, 300, JSON.stringify(roots));
    return roots;
  }

  // Challenge 6: Cycle detection for category parent update
  async validateCategoryCycle(categoryId: string, newParentId: string, tenantId: string): Promise<void> {
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
