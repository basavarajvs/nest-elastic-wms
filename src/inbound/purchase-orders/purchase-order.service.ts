import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PurchaseOrderService {
  private readonly logger = new Logger(PurchaseOrderService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    // Auto-populate vendor details from vendor master
    let vendorName: string | undefined;
    let vendorCode: string | undefined;
    let vendorAddressLine1: string | undefined;
    let vendorCity: string | undefined;
    let vendorStateProvince: string | undefined;
    let vendorPostalCode: string | undefined;
    let vendorCountryCode: string | undefined;
    let vendorContactName: string | undefined;
    let vendorContactPhone: string | undefined;
    let vendorContactEmail: string | undefined;

    const vendor = await this.prisma.vendors.findFirst({
      where: { tenant_id: tenantId, vendor_id: BigInt(dto.vendorId) },
      include: {
        vendor_addresses: { where: { is_default: true, is_active: true }, take: 1 },
        vendor_contacts: { where: { is_primary: true, is_active: true }, take: 1 },
      },
    });
    if (vendor) {
      vendorName = vendor.vendor_name;
      vendorCode = vendor.vendor_code;
      const addr = vendor.vendor_addresses?.[0];
      if (addr) {
        vendorAddressLine1 = addr.address_line1 ?? undefined;
        vendorCity = addr.city ?? undefined;
        vendorStateProvince = addr.state_province ?? undefined;
        vendorPostalCode = addr.postal_code ?? undefined;
        vendorCountryCode = addr.country_code ?? undefined;
      }
      const contact = vendor.vendor_contacts?.[0];
      if (contact) {
        vendorContactName = `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim() || undefined;
        vendorContactPhone = contact.phone ?? undefined;
        vendorContactEmail = contact.email ?? undefined;
      }
    }

    // Calculate line totals
    let totalPoValue = 0;
    let totalPoQuantity = 0;
    for (const line of dto.lines || []) {
      const lineTotal = Number(line.orderedQuantity || 0) * Number(line.unitCost || 0);
      totalPoValue += lineTotal;
      totalPoQuantity += Number(line.orderedQuantity || 0);
    }

    const po = await this.prisma.purchase_orders.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        po_number: dto.poNumber,
        po_name: dto.poName,
        description: dto.description,
        vendor_id: BigInt(dto.vendorId),
        vendor_name: vendorName,
        vendor_code: vendorCode,
        vendor_address_line1: vendorAddressLine1,
        vendor_city: vendorCity,
        vendor_state_province: vendorStateProvince,
        vendor_postal_code: vendorPostalCode,
        vendor_country_code: vendorCountryCode,
        vendor_contact_name: vendorContactName,
        vendor_contact_phone: vendorContactPhone,
        vendor_contact_email: vendorContactEmail,
        order_date: dto.orderDate ? new Date(dto.orderDate) : new Date(),
        required_date: dto.requiredDate ? new Date(dto.requiredDate) : undefined,
        promised_date: dto.promisedDate ? new Date(dto.promisedDate) : undefined,
        currency_code: dto.currencyCode || 'USD',
        total_po_value: totalPoValue,
        total_po_quantity: totalPoQuantity,
        notes: dto.notes,
        requested_by_user_id: dto.requestedByUserId,
      },
    });

    // Create lines separately (no nested create relation on purchase_orders)
    if (dto.lines?.length) {
      await this.prisma.purchase_order_lines.createMany({
        data: dto.lines.map((line: any) => ({
          tenant_id: tenantId,
          facility_id: BigInt(dto.facilityId),
          po_id: po.po_id,
          line_number: line.lineNumber,
          product_id: BigInt(line.productId),
          product_name: line.productName,
          product_code: line.productCode,
          supplier_part_number: line.supplierPartNumber,
          ordered_quantity: line.orderedQuantity,
          uom_id: BigInt(line.uomId),
          unit_cost: line.unitCost,
          line_total: Number(line.orderedQuantity || 0) * Number(line.unitCost || 0),
          required_date: line.requiredDate ? new Date(line.requiredDate) : undefined,
          promised_date: line.promisedDate ? new Date(line.promisedDate) : undefined,
          expected_receipt_date: line.expectedReceiptDate ? new Date(line.expectedReceiptDate) : undefined,
          notes: line.notes,
        })),
      });
    }

    return this.findById(tenantId, po.po_id);
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, facility_id: BigInt(query.facilityId) };
    if (query.vendorId) where.vendor_id = BigInt(query.vendorId);
    if (query.search) {
      where.OR = [
        { po_number: { contains: query.search, mode: 'insensitive' } },
        { vendor_name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.purchase_orders.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.purchase_orders.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, poId: bigint) {
    const po = await this.prisma.purchase_orders.findFirst({
      where: { tenant_id: tenantId, po_id: poId },
    });
    if (!po) return null;
    const lines = await this.prisma.purchase_order_lines.findMany({
      where: { tenant_id: tenantId, po_id: poId },
      orderBy: { line_number: 'asc' },
    });
    return { ...po, lines };
  }

  async update(tenantId: string, poId: bigint, dto: any) {
    return this.prisma.purchase_orders.updateMany({
      where: { tenant_id: tenantId, po_id: poId },
      data: {
        po_name: dto.poName,
        description: dto.description,
        required_date: dto.requiredDate ? new Date(dto.requiredDate) : undefined,
        promised_date: dto.promisedDate ? new Date(dto.promisedDate) : undefined,
        notes: dto.notes,
      },
    });
  }

  async approve(tenantId: string, poId: bigint, userId: string) {
    const po = await this.prisma.purchase_orders.findFirst({
      where: { tenant_id: tenantId, po_id: poId },
    });
    if (!po) throw new BadRequestException('Purchase order not found');
    if (po.approved_by_user_id) throw new BadRequestException('Purchase order already approved');

    return this.prisma.purchase_orders.updateMany({
      where: { tenant_id: tenantId, po_id: poId },
      data: {
        approved_by_user_id: userId,
        approved_date: new Date(),
      },
    });
  }

  async delete(tenantId: string, poId: bigint) {
    return this.prisma.purchase_orders.deleteMany({
      where: { tenant_id: tenantId, po_id: poId },
    });
  }

  async findLines(tenantId: string, poId: bigint) {
    return this.prisma.purchase_order_lines.findMany({
      where: { tenant_id: tenantId, po_id: poId },
      orderBy: { line_number: 'asc' },
    });
  }

  async updateLineStatus(tenantId: string, lineId: bigint, status: string) {
    return this.prisma.purchase_order_lines.updateMany({
      where: { tenant_id: tenantId, line_id: lineId },
      data: { status },
    });
  }
}
