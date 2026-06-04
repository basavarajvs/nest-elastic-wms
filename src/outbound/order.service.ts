import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { CreateOrderDto } from './dtos/order.dto';

const LINE_STATUS_TO_HEADER: Record<string, string> = {
  ALLOCATED: 'ALLOCATED',
  RELEASED: 'WAVED',
  PICK_IN_PROGRESS: 'WAVED',
  PICKED: 'PICKED',
  PACKED: 'PACKED',
  READY_TO_SHIP: 'PACKED',
  SHIPPED: 'SHIPPED',
};

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateOrderDto, tenantId: string): Promise<any> {
    const count = await (this.prisma as any).salesOrder.count({
      where: { tenantId, facilityId: dto.facilityId },
    });
    const now = new Date();
    const orderNumber = `SO-${now.getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    const order = await (this.prisma as any).salesOrder.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        orderNumber,
        clientCode: dto.clientCode,
        orderType: dto.orderType || 'STANDARD',
        priority: dto.priority ?? 10,
        deliveryAddress: dto.deliveryAddress || undefined,
        requestedDeliveryDate: dto.requestedDeliveryDate ? new Date(dto.requestedDeliveryDate) : null,
        notes: dto.notes,
        lines: {
          create: dto.lines.map((l) => ({
            tenantId,
            facilityId: dto.facilityId,
            productId: l.productId,
            requestedQuantity: l.requestedQuantity,
            uomId: l.uomId,
            notes: l.notes,
          })),
        },
      },
      include: { lines: true },
    });

    this.eventEmitter.emit('order.created', { orderId: order.id, tenantId });
    return order;
  }

  async validate(orderId: string, tenantId: string): Promise<any> {
    const order = await (this.prisma as any).salesOrder.findFirst({
      where: { id: orderId, tenantId },
      include: { lines: true },
    });
    if (!order) throw new BadRequestException('Order not found');
    if (order.status !== 'CREATED') throw new BadRequestException('Order must be in CREATED status to validate');

    for (const line of order.lines) {
      const product = await (this.prisma as any).product.findFirst({
        where: { id: line.productId, tenantId },
      });
      if (!product || product.status === 'DISCONTINUED') {
        throw new BadRequestException(`Product ${line.productId} is not active`);
      }
    }

    return (this.prisma as any).salesOrder.update({
      where: { id: orderId },
      data: { status: 'VALIDATED' },
    });
  }

  async syncStatusFromLines(orderId: string, tenantId: string): Promise<any> {
    const order = await (this.prisma as any).salesOrder.findFirst({
      where: { id: orderId, tenantId },
      include: { lines: true },
    });
    if (!order) throw new BadRequestException('Order not found');

    const lineStatuses = order.lines.map((l: any) => l.status);
    const uniqueStatuses = [...new Set(lineStatuses)];

    if (uniqueStatuses.length === 1 && uniqueStatuses[0] === 'SHIPPED') {
      return this.updateHeaderStatus(orderId, 'SHIPPED');
    }
    if (uniqueStatuses.every((s) => s === 'PACKED' || s === 'READY_TO_SHIP' || s === 'SHIPPED')) {
      return this.updateHeaderStatus(orderId, 'PACKED');
    }
    if (uniqueStatuses.every((s) => s === 'PICKED' || s === 'PACKED')) {
      return this.updateHeaderStatus(orderId, 'PICKED');
    }
    if (lineStatuses.includes('RELEASED') || lineStatuses.includes('PICK_IN_PROGRESS') || lineStatuses.includes('PICKED')) {
      return this.updateHeaderStatus(orderId, 'WAVED');
    }
    if (uniqueStatuses.every((s) => s === 'ALLOCATED')) {
      return this.updateHeaderStatus(orderId, 'ALLOCATED');
    }

    return order;
  }

  // ── Event listeners ──
  @OnEvent('allocation.soft_done')
  async onAllocationSoftDone(payload: { orderId: string; tenantId: string }) {
    try {
      await this.syncStatusFromLines(payload.orderId, payload.tenantId);
    } catch (err: any) {
      this.logger.error(`syncStatusFromLines failed for ${payload.orderId}: ${err.message}`);
    }
  }

  @OnEvent('allocation.hard_locked')
  async onAllocationHardLocked(payload: { orderId: string; tenantId: string }) {
    try {
      await this.syncStatusFromLines(payload.orderId, payload.tenantId);
    } catch (err: any) {
      this.logger.error(`syncStatusFromLines failed for ${payload.orderId}: ${err.message}`);
    }
  }

  @OnEvent('picking.completed')
  async onPickingCompleted(payload: { orderLineId: string; tenantId: string }) {
    try {
      const line = await (this.prisma as any).salesOrderLine.findFirst({
        where: { id: payload.orderLineId, tenantId: payload.tenantId },
        select: { salesOrderId: true },
      });
      if (line) {
        await this.syncStatusFromLines(line.salesOrderId, payload.tenantId);
      }
    } catch (err: any) {
      this.logger.error(`syncStatusFromLines on picking completed failed: ${err.message}`);
    }
  }

  private async updateHeaderStatus(orderId: string, newStatus: string): Promise<any> {
    const order = await (this.prisma as any).salesOrder.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    this.eventEmitter.emit('order.status_changed', {
      orderId: order.id,
      orderNumber: order.orderNumber || order.id,
      clientCode: order.clientCode || '',
      status: order.status,
      itemsCount: 0,
      totalValue: order.totalValue || 0,
      tenantId: order.tenantId,
    });

    return order;
  }

  async updateStatus(orderId: string, dto: { status: string }, tenantId: string): Promise<any> {
    const order = await (this.prisma as any).salesOrder.findFirst({
      where: { id: orderId, tenantId },
    });
    if (!order) throw new BadRequestException('Order not found');

    const updated = await (this.prisma as any).salesOrder.update({
      where: { id: orderId },
      data: { status: dto.status },
    });

    this.eventEmitter.emit('order.status_changed', {
      orderId: updated.id,
      orderNumber: updated.orderNumber || updated.id,
      clientCode: updated.clientCode || '',
      status: updated.status,
      itemsCount: 0,
      totalValue: updated.totalValue || 0,
      tenantId: updated.tenantId,
    });

    return updated;
  }

  async findById(orderId: string, tenantId: string): Promise<any> {
    const order = await (this.prisma as any).salesOrder.findFirst({
      where: { id: orderId, tenantId },
      include: {
        lines: {
          include: {
            allocations: true,
            product: {
              select: { id: true, name: true, productCode: true },
            },
          },
        },
      },
    });
    if (!order) throw new BadRequestException('Order not found');
    return order;
  }

  async list(tenantId: string, filters: {
    status?: string;
    clientCode?: string;
    facilityId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    const where: any = { tenantId };
    if (filters.status) {
      const statuses = filters.status.split(',').map((s: string) => s.trim().toUpperCase());
      where.status = { in: statuses };
    }
    if (filters.clientCode) where.clientCode = filters.clientCode;
    if (filters.facilityId) where.facilityId = filters.facilityId;

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 200);
    const [data, total] = await Promise.all([
      (this.prisma as any).salesOrder.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { lines: true },
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).salesOrder.count({ where }),
    ]);
    return { data, total };
  }
}
