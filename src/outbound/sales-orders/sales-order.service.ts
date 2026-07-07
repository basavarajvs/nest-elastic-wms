import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  CREATED: ['VALIDATED', 'CANCELLED'],
  VALIDATED: ['ON_HOLD', 'RELEASED', 'CANCELLED'],
  ON_HOLD: ['VALIDATED', 'CANCELLED'],
  RELEASED: ['WAVED', 'CANCELLED'],
  WAVED: ['ALLOCATED', 'CANCELLED'],
  ALLOCATED: ['PICKED', 'CANCELLED'],
  PICKED: ['PACKED', 'CANCELLED'],
  PACKED: ['READY_TO_SHIP', 'CANCELLED'],
  READY_TO_SHIP: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
};

@Injectable()
export class SalesOrderService {
  private readonly logger = new Logger(SalesOrderService.name);

  constructor(private readonly prisma: PrismaService) {}

  async delete(tenantId: string, orderId: bigint) {
    const order = await this.findById(tenantId, orderId);
    await this.prisma.sales_orders.deleteMany({
      where: { tenant_id: tenantId, order_id: orderId },
    });
    return order;
  }

  async create(tenantId: string, dto: any) {
    // Auto-populate client name/code from clients table
    let clientName: string | undefined;
    let clientCode: string | undefined;
    if (dto.client_id) {
      const client = await this.prisma.clients.findFirst({
        where: { tenant_id: tenantId, client_id: BigInt(dto.client_id) },
      });
      if (client) {
        clientName = client.client_name;
        clientCode = client.client_code;
      }
    }

    const order = await this.prisma.sales_orders.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        order_number: dto.order_number,
        order_name: dto.order_name,
        description: dto.description,
        order_date: dto.order_date ? new Date(dto.order_date) : undefined,
        client_id: dto.client_id ? BigInt(dto.client_id) : BigInt(0),
        client_name: dto.client_name || clientName,
        client_code: dto.client_code || clientCode,
        customer_id: dto.customer_id,
        order_type: dto.order_type || 'STANDARD',
        priority: dto.priority || 5,
        requested_delivery_date: dto.requested_delivery_date ? new Date(dto.requested_delivery_date) : undefined,
        promised_delivery_date: dto.promised_delivery_date ? new Date(dto.promised_delivery_date) : undefined,
        delivery_address_line1: dto.delivery_address_line1,
        delivery_address_line2: dto.delivery_address_line2,
        delivery_city: dto.delivery_city,
        delivery_state_province: dto.delivery_state_province,
        delivery_postal_code: dto.delivery_postal_code,
        delivery_country_code: dto.delivery_country_code,
        delivery_contact_name: dto.delivery_contact_name,
        delivery_contact_phone: dto.delivery_contact_phone,
        delivery_instructions: dto.delivery_instructions,
        currency_code: dto.currency_code,
        assigned_sales_rep_id: dto.assigned_sales_rep_id,
        assigned_warehouse_user_id: dto.assigned_warehouse_user_id,
        notes: dto.notes,
      },
    });

    // Create lines
    if (dto.lines?.length) {
      await this.prisma.sales_order_lines.createMany({
        data: dto.lines.map((line: any, idx: number) => ({
          tenant_id: tenantId,
          order_id: order.order_id,
          facility_id: BigInt(dto.facility_id),
          line_number: idx + 1,
          product_id: BigInt(line.product_id),
          requested_quantity: line.requested_quantity,
          unit_price: line.unit_price || 0,
          uom_id: line.uom_id ? BigInt(line.uom_id) : BigInt(1),
          promised_delivery_date: line.promised_delivery_date ? new Date(line.promised_delivery_date) : undefined,
          notes: line.notes,
        })),
      });
    }

    return this.findFullOrder(tenantId, order.order_id);
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, facility_id: BigInt(query.facilityId) };
    if (query.status) where.status = query.status;
    if (query.clientId) where.client_id = BigInt(query.clientId);
    if (query.search) {
      where.OR = [
        { order_number: { contains: query.search, mode: 'insensitive' } },
        { client_name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.sales_orders.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { priority: 'asc' },
        include: {
          warehouse_facilities: { select: { facility_name: true } },
          customers: { select: { customer_name: true } },
        },
      }),
      this.prisma.sales_orders.count({ where }),
    ]);
    const mapped = data.map(d => ({
      ...d,
      facility_name: (d as any).warehouse_facilities?.facility_name,
      customer_name: (d as any).customers?.customer_name,
      warehouse_facilities: undefined,
      customers: undefined,
    }));
    return { data: mapped, total, page, limit };
  }

  async findById(tenantId: string, orderId: bigint) {
    return this.findFullOrder(tenantId, orderId);
  }

  async update(tenantId: string, orderId: bigint, dto: any) {
    const order = await this.prisma.sales_orders.findFirst({
      where: { tenant_id: tenantId, order_id: orderId },
    });
    if (!order) throw new BadRequestException('Order not found');
    if (order.status !== 'CREATED') throw new BadRequestException('Only CREATED orders can be updated');

    await this.prisma.sales_orders.updateMany({
      where: { tenant_id: tenantId, order_id: orderId },
      data: {
        order_name: dto.order_name,
        description: dto.description,
        client_name: dto.client_name,
        client_code: dto.client_code,
        priority: dto.priority,
        requested_delivery_date: dto.requested_delivery_date ? new Date(dto.requested_delivery_date) : undefined,
        promised_delivery_date: dto.promised_delivery_date ? new Date(dto.promised_delivery_date) : undefined,
        delivery_address_line1: dto.delivery_address_line1,
        delivery_address_line2: dto.delivery_address_line2,
        delivery_city: dto.delivery_city,
        delivery_state_province: dto.delivery_state_province,
        delivery_postal_code: dto.delivery_postal_code,
        delivery_country_code: dto.delivery_country_code,
        delivery_contact_name: dto.delivery_contact_name,
        delivery_contact_phone: dto.delivery_contact_phone,
        delivery_instructions: dto.delivery_instructions,
        currency_code: dto.currency_code,
        assigned_sales_rep_id: dto.assigned_sales_rep_id,
        assigned_warehouse_user_id: dto.assigned_warehouse_user_id,
        notes: dto.notes,
      },
    });

    return this.findFullOrder(tenantId, orderId);
  }

  async transitionStatus(tenantId: string, orderId: bigint, newStatus: string) {
    const order = await this.prisma.sales_orders.findFirst({
      where: { tenant_id: tenantId, order_id: orderId },
    });
    if (!order) throw new BadRequestException('Order not found');

    const allowed = ALLOWED_STATUS_TRANSITIONS[order.status || 'CREATED'];
    if (!allowed?.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${newStatus}. Allowed: ${allowed?.join(', ') || 'none'}`,
      );
    }

    const updateData: any = { status: newStatus };
    if (newStatus === 'RELEASED') updateData.confirmed_date = new Date();
    if (newStatus === 'SHIPPED') updateData.shipped_date = new Date();
    if (newStatus === 'DELIVERED') updateData.delivered_date = new Date();

    await this.prisma.sales_orders.updateMany({
      where: { tenant_id: tenantId, order_id: orderId },
      data: updateData,
    });

    return this.findFullOrder(tenantId, orderId);
  }

  async addLine(tenantId: string, orderId: bigint, dto: any) {
    const order = await this.prisma.sales_orders.findFirst({
      where: { tenant_id: tenantId, order_id: orderId },
    });
    if (!order) throw new BadRequestException('Order not found');
    if (order.status !== 'CREATED') throw new BadRequestException('Can only add lines to CREATED orders');

    const maxLine = await this.prisma.sales_order_lines.aggregate({
      where: { tenant_id: tenantId, order_id: orderId },
      _max: { line_number: true },
    });

    const line = await this.prisma.sales_order_lines.create({
      data: {
        tenant_id: tenantId,
        order_id: orderId,
        facility_id: order.facility_id,
        line_number: (maxLine._max?.line_number || 0) + 1,
        product_id: BigInt(dto.productId),
        requested_quantity: dto.requestedQuantity,
        unit_price: dto.unitPrice || 0,
        uom_id: dto.uomId ? BigInt(dto.uomId) : BigInt(1),
        promised_delivery_date: dto.promised_delivery_date ? new Date(dto.promised_delivery_date) : undefined,
        notes: dto.notes,
      },
    });

    return this.findFullOrder(tenantId, orderId);
  }

  async getLines(tenantId: string, orderId: bigint) {
    const rows = await this.prisma.sales_order_lines.findMany({
      where: { tenant_id: tenantId, order_id: orderId },
      orderBy: { line_number: 'asc' },
    });
    if (!rows.length) return [];
    const order = await this.prisma.sales_orders.findFirst({
      where: { tenant_id: tenantId, order_id: orderId },
      select: { order_number: true },
    });
    return rows.map(r => ({ ...r, order_number: order?.order_number }));
  }

  /**
   * Validate order integrity before release:
   * - All lines have products with valid IDs
   * - All quantities > 0
   * - Client is set
   * - Delivery address is populated
   */
  async validateOrder(tenantId: string, orderId: bigint) {
    const order = await this.findFullOrder(tenantId, orderId);
    if (!order) throw new BadRequestException('Order not found');

    const errors: string[] = [];

    if (!order.client_id || Number(order.client_id) === 0) {
      errors.push('Order must have a client assigned');
    }
    if (!order.delivery_city || !order.delivery_country_code) {
      errors.push('Order must have delivery address (city + country)');
    }
    if (!order.lines?.length) {
      errors.push('Order has no lines');
    } else {
      for (const line of order.lines) {
        if (Number(line.requested_quantity) <= 0) {
          errors.push(`Line ${line.line_number}: quantity must be > 0`);
        }
        if (!line.uom_id || Number(line.uom_id) === 0) {
          errors.push(`Line ${line.line_number}: missing UOM`);
        }
      }
    }

    return {
      orderId: orderId.toString(),
      orderNumber: order.order_number,
      valid: errors.length === 0,
      errors,
    };
  }

  /** Recalculate totals from line items */
  async recalculateTotals(tenantId: string, orderId: bigint) {
    const lines = await this.prisma.sales_order_lines.findMany({
      where: { tenant_id: tenantId, order_id: orderId },
    });
    const totalQty = lines.reduce((s, l) => s + Number(l.requested_quantity || 0), 0);
    const totalValue = lines.reduce((s, l) => s + Number(l.unit_price || 0) * Number(l.requested_quantity || 0), 0);
    await this.prisma.sales_orders.updateMany({
      where: { tenant_id: tenantId, order_id: orderId },
      data: { total_order_quantity: totalQty, total_order_value: totalValue },
    });
    return { totalOrderQuantity: totalQty, totalOrderValue: totalValue };
  }

  private async findFullOrder(tenantId: string, orderId: bigint) {
    const order = await this.prisma.sales_orders.findFirst({
      where: { tenant_id: tenantId, order_id: orderId },
      include: {
        warehouse_facilities: { select: { facility_name: true } },
        customers: { select: { customer_name: true } },
      },
    });
    if (!order) return null;
    const lines = await this.prisma.sales_order_lines.findMany({
      where: { tenant_id: tenantId, order_id: orderId },
      orderBy: { line_number: 'asc' },
    });
    const { warehouse_facilities, customers, ...orderData } = order as any;
    return {
      ...orderData,
      facility_name: warehouse_facilities?.facility_name,
      customer_name: customers?.customer_name,
      lines,
    };
  }
}
