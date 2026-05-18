import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
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

  private async updateHeaderStatus(orderId: string, newStatus: string): Promise<any> {
    return (this.prisma as any).salesOrder.update({
      where: { id: orderId },
      data: { status: newStatus },
    });
  }

  async list(tenantId: string, filters: {
    status?: string;
    clientCode?: string;
    facilityId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    const where: any = { tenantId };
    if (filters.status) where.status = filters.status;
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
