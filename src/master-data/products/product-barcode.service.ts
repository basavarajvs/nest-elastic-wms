import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductBarcodeService {
  private readonly logger = new Logger(ProductBarcodeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.product_barcodes.create({
      data: {
        tenant_id: tenantId,
        product_id: BigInt(dto.product_id),
        variant_id: dto.variant_id ? BigInt(dto.variant_id) : null,
        barcode_value: dto.barcode_value,
        barcode_type: dto.barcode_type ?? 'CODE128',
        is_primary: dto.is_primary ?? false,
        is_active: dto.is_active ?? true,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.productId) where.product_id = BigInt(query.productId);
    if (query.isActive !== undefined) where.is_active = query.isActive;
    if (query.isPrimary !== undefined) where.is_primary = query.isPrimary;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.product_barcodes.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { barcode_value: 'asc' },
      }),
      this.prisma.product_barcodes.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, barcodeId: bigint) {
    const record = await this.prisma.product_barcodes.findFirst({
      where: { tenant_id: tenantId, barcode_id: barcodeId },
    });
    if (!record) throw new NotFoundException('Product barcode not found');
    return record;
  }

  async update(tenantId: string, barcodeId: bigint, dto: any) {
    await this.findById(tenantId, barcodeId);
    await this.prisma.product_barcodes.updateMany({
      where: { tenant_id: tenantId, barcode_id: barcodeId },
      data: {
        barcode_value: dto.barcode_value,
        barcode_type: dto.barcode_type,
        is_primary: dto.is_primary,
        is_active: dto.is_active,
      },
    });
    return this.findById(tenantId, barcodeId);
  }

  async delete(tenantId: string, barcodeId: bigint) {
    const record = await this.findById(tenantId, barcodeId);
    await this.prisma.product_barcodes.deleteMany({
      where: { tenant_id: tenantId, barcode_id: barcodeId },
    });
    return record;
  }
}
