import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CrossDockService {
  private readonly logger = new Logger(CrossDockService.name);

  constructor(private readonly prisma: PrismaService) {}

  async delete(tenantId: string, id: bigint) {
    return this.prisma.cross_dock_operations.deleteMany({
      where: { tenant_id: tenantId, cross_dock_id: id },
    });
  }

  async create(tenantId: string, userId: string | undefined, dto: any) {
    return this.prisma.cross_dock_operations.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        cross_dock_number: dto.crossDockNumber,
        inbound_shipment_id: dto.inboundShipmentId ? BigInt(dto.inboundShipmentId) : undefined,
        outbound_shipment_id: dto.outboundShipmentId ? BigInt(dto.outboundShipmentId) : undefined,
        product_id: BigInt(dto.productId),
        sku: dto.sku,
        quantity: dto.quantity,
        unit_of_measure: dto.unitOfMeasure || 'EACH',
        receiving_dock_id: dto.receivingDockId ? BigInt(dto.receivingDockId) : undefined,
        shipping_dock_id: dto.shippingDockId ? BigInt(dto.shippingDockId) : undefined,
        staging_location_id: dto.stagingLocationId ? BigInt(dto.stagingLocationId) : undefined,
        status: dto.status || 'PENDING',
        priority: dto.priority || 'NORMAL',
        expected_arrival_time: dto.expectedArrivalTime ? new Date(dto.expectedArrivalTime) : undefined,
        expected_departure_time: dto.expectedDepartureTime ? new Date(dto.expectedDepartureTime) : undefined,
        assigned_to: dto.assignedTo,
        notes: dto.notes,
        customer_order_id: dto.customerOrderId ? BigInt(dto.customerOrderId) : undefined,
        carrier_id: dto.carrierId ? BigInt(dto.carrierId) : undefined,
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

    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.cross_dock_operations.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.cross_dock_operations.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: bigint) {
    const op = await this.prisma.cross_dock_operations.findFirst({
      where: { tenant_id: tenantId, cross_dock_id: id },
    });
    if (!op) throw new NotFoundException('Cross-dock operation not found');
    return op;
  }

  async update(tenantId: string, id: bigint, userId: string | undefined, dto: any) {
    await this.findById(tenantId, id);
    const data: Record<string, any> = { updated_by: userId };
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.quantity !== undefined) data.quantity = dto.quantity;
    if (dto.receivingDockId !== undefined) data.receiving_dock_id = BigInt(dto.receivingDockId);
    if (dto.shippingDockId !== undefined) data.shipping_dock_id = BigInt(dto.shippingDockId);
    if (dto.stagingLocationId !== undefined) data.staging_location_id = BigInt(dto.stagingLocationId);
    if (dto.actualArrivalTime !== undefined) data.actual_arrival_time = new Date(dto.actualArrivalTime);
    if (dto.actualDepartureTime !== undefined) data.actual_departure_time = new Date(dto.actualDepartureTime);
    if (dto.transferStartTime !== undefined) data.transfer_start_time = new Date(dto.transferStartTime);
    if (dto.transferEndTime !== undefined) data.transfer_end_time = new Date(dto.transferEndTime);
    if (dto.assignedTo !== undefined) data.assigned_to = dto.assignedTo;
    if (dto.notes !== undefined) data.notes = dto.notes;

    await this.prisma.cross_dock_operations.updateMany({
      where: { tenant_id: tenantId, cross_dock_id: id },
      data,
    });
    return this.findById(tenantId, id);
  }
}
