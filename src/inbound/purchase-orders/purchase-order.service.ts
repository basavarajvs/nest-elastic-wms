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
    let vendorAddressLine2: string | undefined;
    let vendorCity: string | undefined;
    let vendorStateProvince: string | undefined;
    let vendorPostalCode: string | undefined;
    let vendorCountryCode: string | undefined;
    let vendorContactName: string | undefined;
    let vendorContactPhone: string | undefined;
    let vendorContactEmail: string | undefined;

    const vendor = await this.prisma.vendors.findFirst({
      where: { tenant_id: tenantId, vendor_id: BigInt(dto.vendor_id) },
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
        vendorAddressLine2 = addr.address_line2 ?? undefined;
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
      const lineTotal = Number(line.ordered_quantity || 0) * Number(line.unit_cost || 0);
      totalPoValue += lineTotal;
      totalPoQuantity += Number(line.ordered_quantity || 0);
    }

    const po = await this.prisma.purchase_orders.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        po_number: dto.po_number,
        po_name: dto.po_name,
        description: dto.description,
        vendor_id: BigInt(dto.vendor_id),
        vendor_name: vendorName,
        vendor_code: vendorCode,
        vendor_address_line1: vendorAddressLine1,
        vendor_address_line2: vendorAddressLine2,
        vendor_city: vendorCity,
        vendor_state_province: vendorStateProvince,
        vendor_postal_code: vendorPostalCode,
        vendor_country_code: vendorCountryCode,
        vendor_contact_name: vendorContactName,
        vendor_contact_phone: vendorContactPhone,
        vendor_contact_email: vendorContactEmail,
        order_date: dto.order_date ? new Date(dto.order_date) : new Date(),
        required_date: dto.required_date ? new Date(dto.required_date) : undefined,
        promised_date: dto.promised_date ? new Date(dto.promised_date) : undefined,
        expected_receipt_date: dto.expected_receipt_date ? new Date(dto.expected_receipt_date) : undefined,
        currency_code: dto.currency_code || 'USD',
        total_po_value: totalPoValue,
        total_po_quantity: totalPoQuantity,
        notes: dto.notes,
        requested_by_user_id: dto.requested_by_user_id,
        assigned_buyer_id: dto.assigned_buyer_id,
      },
    });

    // Create lines separately (no nested create relation on purchase_orders)
    if (dto.lines?.length) {
      await this.prisma.purchase_order_lines.createMany({
        data: dto.lines.map((line: any) => ({
          tenant_id: tenantId,
          facility_id: BigInt(dto.facility_id),
          po_id: po.po_id,
          line_number: line.line_number,
          product_id: BigInt(line.product_id),
          product_name: line.product_name,
          product_code: line.product_code,
          supplier_part_number: line.supplier_part_number,
          ordered_quantity: line.ordered_quantity,
          uom_id: BigInt(line.uom_id),
          unit_cost: line.unit_cost,
          required_date: line.required_date ? new Date(line.required_date) : undefined,
          promised_date: line.promised_date ? new Date(line.promised_date) : undefined,
          expected_receipt_date: line.expected_receipt_date ? new Date(line.expected_receipt_date) : undefined,
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
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.purchase_orders.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { warehouse_facilities: true },
      }),
      this.prisma.purchase_orders.count({ where }),
    ]);
    return {
      data: data.map(po => ({
        ...po,
        facility_name: po.warehouse_facilities?.facility_name ?? null,
        warehouse_facilities: undefined,
      })),
      total, page, limit,
    };
  }

  async findById(tenantId: string, poId: bigint) {
    const po = await this.prisma.purchase_orders.findFirst({
      where: { tenant_id: tenantId, po_id: poId },
      include: { warehouse_facilities: true },
    });
    if (!po) return null;
    const lines = await this.prisma.purchase_order_lines.findMany({
      where: { tenant_id: tenantId, po_id: poId },
      orderBy: { line_number: 'asc' },
      include: { warehouse_facilities: true, units_of_measure: true },
    });
    return {
      ...po,
      facility_name: po.warehouse_facilities?.facility_name ?? null,
      warehouse_facilities: undefined,
      lines: lines.map(line => ({
        ...line,
        facility_name: line.warehouse_facilities?.facility_name ?? null,
        uom_name: line.units_of_measure?.uom_name ?? null,
        warehouse_facilities: undefined,
        units_of_measure: undefined,
      })),
    };
  }

  async update(tenantId: string, poId: bigint, dto: any) {
    await this.prisma.purchase_orders.updateMany({
      where: { tenant_id: tenantId, po_id: poId },
      data: {
        po_name: dto.po_name,
        description: dto.description,
        required_date: dto.required_date ? new Date(dto.required_date) : undefined,
        promised_date: dto.promised_date ? new Date(dto.promised_date) : undefined,
        expected_receipt_date: dto.expected_receipt_date ? new Date(dto.expected_receipt_date) : undefined,
        notes: dto.notes,
        assigned_buyer_id: dto.assigned_buyer_id,
      },
    });
    return this.findById(tenantId, poId);
  }

  async approve(tenantId: string, poId: bigint, userId: string) {
    const po = await this.prisma.purchase_orders.findFirst({
      where: { tenant_id: tenantId, po_id: poId },
    });
    if (!po) throw new BadRequestException('Purchase order not found');
    if (po.approved_by_user_id) throw new BadRequestException('Purchase order already approved');

    await this.prisma.purchase_orders.updateMany({
      where: { tenant_id: tenantId, po_id: poId },
      data: {
        approved_by_user_id: userId,
        approved_date: new Date(),
      },
    });
    return this.findById(tenantId, poId);
  }

  async delete(tenantId: string, poId: bigint) {
    return this.prisma.purchase_orders.deleteMany({
      where: { tenant_id: tenantId, po_id: poId },
    });
  }

  async findLines(tenantId: string, poId: bigint) {
    const lines = await this.prisma.purchase_order_lines.findMany({
      where: { tenant_id: tenantId, po_id: poId },
      orderBy: { line_number: 'asc' },
      include: { warehouse_facilities: true, units_of_measure: true },
    });
    return lines.map(line => ({
      ...line,
      facility_name: line.warehouse_facilities?.facility_name ?? null,
      uom_name: line.units_of_measure?.uom_name ?? null,
      warehouse_facilities: undefined,
      units_of_measure: undefined,
    }));
  }

  async updateLineStatus(tenantId: string, lineId: bigint, status: string) {
    await this.prisma.purchase_order_lines.updateMany({
      where: { tenant_id: tenantId, line_id: lineId },
      data: { status },
    });
    return this.prisma.purchase_order_lines.findFirst({
      where: { tenant_id: tenantId, line_id: lineId },
    });
  }
}
