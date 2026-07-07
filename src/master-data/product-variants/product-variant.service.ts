import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductVariantService {
  constructor(private readonly prisma: PrismaService) {}

  private mapVariantRow(r: any) {
    const { products, ...rest } = r;
    return { ...rest, product_name: products?.product_name };
  }

  async create(tenantId: string, dto: any) {
    const row = await this.prisma.product_variants.create({
      data: {
        tenant_id: tenantId,
        product_id: BigInt(dto.product_id),
        variant_code: dto.variant_code,
        variant_name: dto.variant_name,
        length: dto.length,
        width: dto.width,
        height: dto.height,
        weight: dto.weight,
        volume: dto.volume,
        is_active: dto.is_active ?? true,
      },
      include: {
        products: { select: { product_code: true, product_name: true } },
      },
    });
    return this.mapVariantRow(row);
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, is_deleted: false };
    if (query.productId) where.product_id = BigInt(query.productId);
    if (query.isActive !== undefined) where.is_active = query.isActive;
    if (query.search) {
      where.OR = [
        { variant_code: { contains: query.search, mode: 'insensitive' } },
        { variant_name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.product_variants.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { variant_code: 'asc' },
        include: {
          products: { select: { product_code: true, product_name: true } },
        },
      }),
      this.prisma.product_variants.count({ where }),
    ]);
    return { data: data.map(this.mapVariantRow), total, page, limit };
  }

  async findById(tenantId: string, variantId: bigint) {
    const row = await this.prisma.product_variants.findFirst({
      where: { tenant_id: tenantId, variant_id: variantId },
      include: {
        products: { select: { product_code: true, product_name: true } },
        product_barcodes: true,
      },
    });
    return row ? this.mapVariantRow(row) : null;
  }

  async delete(tenantId: string, variantId: bigint) {
    const record = await this.findById(tenantId, variantId);
    await this.prisma.product_variants.deleteMany({
      where: { tenant_id: tenantId, variant_id: variantId },
    });
    return record;
  }

  async update(tenantId: string, variantId: bigint, dto: any) {
    const data: any = {};
    if (dto.variant_code !== undefined) data.variant_code = dto.variant_code;
    if (dto.variant_name !== undefined) data.variant_name = dto.variant_name;
    if (dto.length !== undefined) data.length = dto.length;
    if (dto.width !== undefined) data.width = dto.width;
    if (dto.height !== undefined) data.height = dto.height;
    if (dto.weight !== undefined) data.weight = dto.weight;
    if (dto.volume !== undefined) data.volume = dto.volume;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    await this.prisma.product_variants.updateMany({
      where: { tenant_id: tenantId, variant_id: variantId },
      data,
    });
    return this.findById(tenantId, variantId);
  }
}
