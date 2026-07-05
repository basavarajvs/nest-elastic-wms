import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.products.create({
      data: {
        tenant_id: tenantId,
        product_code: dto.productCode,
        product_name: dto.productName,
        description: dto.description,
        category_id: BigInt(dto.categoryId),
        brand_id: dto.brandId ? BigInt(dto.brandId) : undefined,
        primary_uom_id: BigInt(dto.primaryUomId),
        is_active: dto.isActive ?? true,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, is_deleted: false };
    if (query.isActive !== undefined) where.is_active = query.isActive;
    if (query.categoryId) where.category_id = BigInt(query.categoryId);
    if (query.brandId) where.brand_id = BigInt(query.brandId);
    if (query.search) {
      where.OR = [
        { product_code: { contains: query.search, mode: 'insensitive' } },
        { product_name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.products.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { product_code: 'asc' },
        include: {
          product_categories: { select: { category_code: true, category_name: true } },
          product_brands: { select: { brand_code: true, brand_name: true } },
          units_of_measure: { select: { uom_code: true, uom_name: true } },
        },
      }),
      this.prisma.products.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, productId: bigint) {
    return this.getFullProduct(tenantId, productId);
  }

  async findByBarcode(tenantId: string, barcode: string) {
    const productBarcode = await this.prisma.product_barcodes.findFirst({
      where: { tenant_id: tenantId, barcode_value: barcode, is_active: true },
      include: {
        products: {
          include: {
            product_categories: { select: { category_code: true, category_name: true } },
            product_brands: { select: { brand_code: true, brand_name: true } },
            units_of_measure: { select: { uom_code: true, uom_name: true } },
          },
        },
      },
    });
    return productBarcode?.products || null;
  }

  async getFullProduct(tenantId: string, productId: bigint) {
    const product = await this.prisma.products.findFirst({
      where: { tenant_id: tenantId, product_id: productId },
    });
    if (!product) return null;

    const [barcodes, suppliers, packaging, variants] = await Promise.all([
      this.prisma.product_barcodes.findMany({
        where: { tenant_id: tenantId, product_id: productId, is_active: true },
      }),
      this.prisma.product_suppliers.findMany({
        where: { tenant_id: tenantId, product_id: productId, is_active: true },
        include: {
          vendors: { select: { vendor_code: true, vendor_name: true } },
        },
      }),
      this.prisma.product_packaging_hierarchy.findMany({
        where: { tenant_id: tenantId, product_id: productId },
        include: {
          units_of_measure_product_packaging_hierarchy_parent_uom_idTounits_of_measure: {
            select: { uom_code: true, uom_name: true },
          },
          units_of_measure_product_packaging_hierarchy_child_uom_idTounits_of_measure: {
            select: { uom_code: true, uom_name: true },
          },
        },
      }),
      this.prisma.product_variants.findMany({
        where: { tenant_id: tenantId, product_id: productId, is_active: true },
      }),
    ]);

    return {
      ...product,
      barcodes,
      suppliers,
      packaging,
      variants,
    };
  }

  async update(tenantId: string, productId: bigint, dto: any) {
    const data: any = {};
    if (dto.productCode !== undefined) data.product_code = dto.productCode;
    if (dto.productName !== undefined) data.product_name = dto.productName;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.categoryId !== undefined) data.category_id = BigInt(dto.categoryId);
    if (dto.brandId !== undefined) data.brand_id = BigInt(dto.brandId);
    if (dto.isActive !== undefined) data.is_active = dto.isActive;
    return this.prisma.products.updateMany({
      where: { tenant_id: tenantId, product_id: productId },
      data,
    });
  }

  async delete(tenantId: string, productId: bigint) {
    return this.prisma.products.deleteMany({
      where: { tenant_id: tenantId, product_id: productId },
    });
  }

  async findByCategory(tenantId: string, categoryId: bigint, query: any) {
    const where: any = { tenant_id: tenantId, category_id: categoryId, is_deleted: false };
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.products.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { product_code: 'asc' },
      }),
      this.prisma.products.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async rfLookup(tenantId: string, barcode: string) {
    const productBarcode = await this.prisma.product_barcodes.findFirst({
      where: { tenant_id: tenantId, barcode_value: barcode, is_active: true },
      include: {
        products: {
          include: {
            product_categories: { select: { category_code: true, category_name: true } },
            units_of_measure: { select: { uom_code: true } },
          },
        },
      },
    });
    if (!productBarcode?.products) return null;
    const p = productBarcode.products;
    return {
      productId: p.product_id.toString(),
      productCode: p.product_code,
      productName: p.product_name,
      barcode: productBarcode.barcode_value,
      category: p.product_categories?.category_code || null,
      uom: p.units_of_measure?.uom_code || null,
    };
  }
}
