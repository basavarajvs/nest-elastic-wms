import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CrossDockService {
  private readonly logger = new Logger(CrossDockService.name);

  constructor(private readonly prisma: PrismaService) {}

  async delete(tenantId: string, id: bigint) {
    const entity = await this.findById(tenantId, id);
    await this.prisma.cross_dock_operations.deleteMany({
      where: { tenant_id: tenantId, cross_dock_id: id },
    });
    return entity;
  }

  async create(tenantId: string, userId: string | undefined, dto: any) {
    return this.prisma.cross_dock_operations.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        cross_dock_number: dto.cross_dock_number,
        inbound_shipment_id: dto.inbound_shipment_id ? BigInt(dto.inbound_shipment_id) : undefined,
        outbound_shipment_id: dto.outbound_shipment_id ? BigInt(dto.outbound_shipment_id) : undefined,
        product_id: BigInt(dto.product_id),
        sku: dto.sku,
        quantity: dto.quantity,
        unit_of_measure: dto.unit_of_measure || 'EACH',
        receiving_dock_id: dto.receiving_dock_id ? BigInt(dto.receiving_dock_id) : undefined,
        shipping_dock_id: dto.shipping_dock_id ? BigInt(dto.shipping_dock_id) : undefined,
        staging_location_id: dto.staging_location_id ? BigInt(dto.staging_location_id) : undefined,
        status: dto.status || 'PENDING',
        priority: dto.priority || 'NORMAL',
        expected_arrival_time: dto.expected_arrival_time ? new Date(dto.expected_arrival_time) : undefined,
        expected_departure_time: dto.expected_departure_time ? new Date(dto.expected_departure_time) : undefined,
        assigned_to: dto.assigned_to,
        notes: dto.notes,
        customer_order_id: dto.customer_order_id ? BigInt(dto.customer_order_id) : undefined,
        carrier_id: dto.carrier_id ? BigInt(dto.carrier_id) : undefined,
        created_by: userId,
        updated_by: userId,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.status) where.status = query.status;
    if (query.sku) where.sku = query.sku;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [rows, total] = await Promise.all([
      this.prisma.cross_dock_operations.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { warehouse_facilities: true },
      }),
      this.prisma.cross_dock_operations.count({ where }),
    ]);
    const data = rows.map(r => ({
      ...r,
      facility_name: r.warehouse_facilities?.facility_name,
      warehouse_facilities: undefined,
    }));
    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: bigint) {
    const op = await this.prisma.cross_dock_operations.findFirst({
      where: { tenant_id: tenantId, cross_dock_id: id },
      include: { warehouse_facilities: true },
    });
    if (!op) throw new NotFoundException('Cross-dock operation not found');
    return {
      ...op,
      facility_name: op.warehouse_facilities?.facility_name,
      warehouse_facilities: undefined,
    };
  }

  async update(tenantId: string, id: bigint, userId: string | undefined, dto: any) {
    await this.findById(tenantId, id);
    const data: Record<string, any> = { updated_by: userId };
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.quantity !== undefined) data.quantity = dto.quantity;
    if (dto.receiving_dock_id !== undefined) data.receiving_dock_id = BigInt(dto.receiving_dock_id);
    if (dto.shipping_dock_id !== undefined) data.shipping_dock_id = BigInt(dto.shipping_dock_id);
    if (dto.staging_location_id !== undefined) data.staging_location_id = BigInt(dto.staging_location_id);
    if (dto.actual_arrival_time !== undefined) data.actual_arrival_time = new Date(dto.actual_arrival_time);
    if (dto.actual_departure_time !== undefined) data.actual_departure_time = new Date(dto.actual_departure_time);
    if (dto.transfer_start_time !== undefined) data.transfer_start_time = new Date(dto.transfer_start_time);
    if (dto.transfer_end_time !== undefined) data.transfer_end_time = new Date(dto.transfer_end_time);
    if (dto.assigned_to !== undefined) data.assigned_to = dto.assigned_to;
    if (dto.notes !== undefined) data.notes = dto.notes;

    await this.prisma.cross_dock_operations.updateMany({
      where: { tenant_id: tenantId, cross_dock_id: id },
      data,
    });
    return this.findById(tenantId, id);
  }
}
