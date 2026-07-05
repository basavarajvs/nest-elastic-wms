import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductVariantService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.product_variants.create({
      data: {
        tenant_id: tenantId,
        product_id: BigInt(dto.productId),
        variant_code: dto.variantCode,
        variant_name: dto.variantName,
        length: dto.length,
        width: dto.width,
        height: dto.height,
        weight: dto.weight,
        volume: dto.volume,
        is_active: dto.isActive ?? true,
      },
    });
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
    const page = query.page || 1;
    const limit = query.limit || 20;
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
    return { data, total, page, limit };
  }

  async findById(tenantId: string, variantId: bigint) {
    return this.prisma.product_variants.findFirst({
      where: { tenant_id: tenantId, variant_id: variantId },
      include: {
        products: { select: { product_code: true, product_name: true } },
        product_barcodes: true,
      },
    });
  }

  async delete(tenantId: string, variantId: bigint) {
    return this.prisma.product_variants.deleteMany({
      where: { tenant_id: tenantId, variant_id: variantId },
    });
  }

  async update(tenantId: string, variantId: bigint, dto: any) {
    const data: any = {};
    if (dto.variantCode !== undefined) data.variant_code = dto.variantCode;
    if (dto.variantName !== undefined) data.variant_name = dto.variantName;
    if (dto.length !== undefined) data.length = dto.length;
    if (dto.width !== undefined) data.width = dto.width;
    if (dto.height !== undefined) data.height = dto.height;
    if (dto.weight !== undefined) data.weight = dto.weight;
    if (dto.volume !== undefined) data.volume = dto.volume;
    if (dto.isActive !== undefined) data.is_active = dto.isActive;
    return this.prisma.product_variants.updateMany({
      where: { tenant_id: tenantId, variant_id: variantId },
      data,
    });
  }
}
