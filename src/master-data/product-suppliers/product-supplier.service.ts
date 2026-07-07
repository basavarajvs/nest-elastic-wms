import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductSupplierService {
  constructor(private readonly prisma: PrismaService) {}

  private mapSupplierRow(r: any) {
    const { products, vendors, ...rest } = r;
    return {
      ...rest,
      product_name: products?.product_name,
      vendor_name: vendors?.vendor_name,
    };
  }

  async create(tenantId: string, dto: any) {
    const row = await this.prisma.product_suppliers.create({
      data: {
        tenant_id: tenantId,
        product_id: BigInt(dto.product_id),
        vendor_id: BigInt(dto.vendor_id),
        supplier_part_number: dto.supplier_part_number,
        lead_time_days: dto.lead_time_days ?? 0,
        cost_price: dto.cost_price,
        currency_code: dto.currency_code ?? 'USD',
        minimum_order_quantity: dto.minimum_order_quantity ?? 1,
        maximum_order_quantity: dto.maximum_order_quantity,
        preferred_supplier: dto.preferred_supplier ?? false,
        is_active: dto.is_active ?? true,
      },
      include: {
        products: { select: { product_code: true, product_name: true } },
        vendors: { select: { vendor_code: true, vendor_name: true } },
      },
    });
    return this.mapSupplierRow(row);
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.productId) where.product_id = BigInt(query.productId);
    if (query.vendorId) where.vendor_id = BigInt(query.vendorId);
    if (query.isActive !== undefined) where.is_active = query.isActive;
    if (query.preferredSupplier !== undefined) where.preferred_supplier = query.preferredSupplier;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
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
    return { data: data.map(this.mapSupplierRow), total, page, limit };
  }

  async findById(tenantId: string, productSupplierId: bigint) {
    const row = await this.prisma.product_suppliers.findFirst({
      where: { tenant_id: tenantId, product_supplier_id: productSupplierId },
      include: {
        products: { select: { product_code: true, product_name: true } },
        vendors: { select: { vendor_code: true, vendor_name: true } },
      },
    });
    return row ? this.mapSupplierRow(row) : null;
  }

  async delete(tenantId: string, productSupplierId: bigint) {
    const record = await this.findById(tenantId, productSupplierId);
    await this.prisma.product_suppliers.deleteMany({
      where: { tenant_id: tenantId, product_supplier_id: productSupplierId },
    });
    return record;
  }

  async update(tenantId: string, productSupplierId: bigint, dto: any) {
    const data: any = {};
    if (dto.vendor_id !== undefined) data.vendor_id = BigInt(dto.vendor_id);
    if (dto.supplier_part_number !== undefined) data.supplier_part_number = dto.supplier_part_number;
    if (dto.lead_time_days !== undefined) data.lead_time_days = dto.lead_time_days;
    if (dto.cost_price !== undefined) data.cost_price = dto.cost_price;
    if (dto.currency_code !== undefined) data.currency_code = dto.currency_code;
    if (dto.minimum_order_quantity !== undefined) data.minimum_order_quantity = dto.minimum_order_quantity;
    if (dto.maximum_order_quantity !== undefined) data.maximum_order_quantity = dto.maximum_order_quantity;
    if (dto.preferred_supplier !== undefined) data.preferred_supplier = dto.preferred_supplier;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    await this.prisma.product_suppliers.updateMany({
      where: { tenant_id: tenantId, product_supplier_id: productSupplierId },
      data,
    });
    return this.findById(tenantId, productSupplierId);
  }
}
