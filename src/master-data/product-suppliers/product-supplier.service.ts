import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductSupplierService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.product_suppliers.create({
      data: {
        tenant_id: tenantId,
        product_id: BigInt(dto.productId),
        vendor_id: BigInt(dto.vendorId),
        supplier_part_number: dto.supplierPartNumber,
        lead_time_days: dto.leadTimeDays ?? 0,
        cost_price: dto.costPrice,
        currency_code: dto.currencyCode ?? 'USD',
        minimum_order_quantity: dto.minimumOrderQuantity ?? 1,
        maximum_order_quantity: dto.maximumOrderQuantity,
        preferred_supplier: dto.preferredSupplier ?? false,
        is_active: dto.isActive ?? true,
      },
      include: {
        vendors: { select: { vendor_code: true, vendor_name: true } },
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.productId) where.product_id = BigInt(query.productId);
    if (query.vendorId) where.vendor_id = BigInt(query.vendorId);
    if (query.isActive !== undefined) where.is_active = query.isActive;
    if (query.preferredSupplier !== undefined) where.preferred_supplier = query.preferredSupplier;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.product_suppliers.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          products: { select: { product_code: true, product_name: true } },
          vendors: { select: { vendor_code: true, vendor_name: true } },
        },
      }),
      this.prisma.product_suppliers.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, productSupplierId: bigint) {
    return this.prisma.product_suppliers.findFirst({
      where: { tenant_id: tenantId, product_supplier_id: productSupplierId },
      include: {
        products: { select: { product_code: true, product_name: true } },
        vendors: { select: { vendor_code: true, vendor_name: true } },
      },
    });
  }

  async delete(tenantId: string, productSupplierId: bigint) {
    return this.prisma.product_suppliers.deleteMany({
      where: { tenant_id: tenantId, product_supplier_id: productSupplierId },
    });
  }

  async update(tenantId: string, productSupplierId: bigint, dto: any) {
    const data: any = {};
    if (dto.vendorId !== undefined) data.vendor_id = BigInt(dto.vendorId);
    if (dto.supplierPartNumber !== undefined) data.supplier_part_number = dto.supplierPartNumber;
    if (dto.leadTimeDays !== undefined) data.lead_time_days = dto.leadTimeDays;
    if (dto.costPrice !== undefined) data.cost_price = dto.costPrice;
    if (dto.currencyCode !== undefined) data.currency_code = dto.currencyCode;
    if (dto.minimumOrderQuantity !== undefined) data.minimum_order_quantity = dto.minimumOrderQuantity;
    if (dto.maximumOrderQuantity !== undefined) data.maximum_order_quantity = dto.maximumOrderQuantity;
    if (dto.preferredSupplier !== undefined) data.preferred_supplier = dto.preferredSupplier;
    if (dto.isActive !== undefined) data.is_active = dto.isActive;
    return this.prisma.product_suppliers.updateMany({
      where: { tenant_id: tenantId, product_supplier_id: productSupplierId },
      data,
    });
  }
}
