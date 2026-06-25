import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateWorkOrderDto, UpdateWorkOrderDto } from './dtos/create-work-order.dto';

@Injectable()
export class WorkOrdersService {
  private readonly logger = new Logger(WorkOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateWorkOrderDto, tenantId: string, requestedByUserId?: string): Promise<any> {
    const count = await this.prisma.workOrder.count({ where: { tenantId } });
    const workOrderNumber = `WO-${(count + 1).toString().padStart(6, '0')}`;

    const order = await this.prisma.workOrder.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        workOrderNumber,
        workOrderType: dto.workOrderType,
        requestedByUserId,
        status: dto.status ?? 'DRAFT',
        priority: dto.priority ?? 'MEDIUM',
        productId: dto.productId,
        quantity: dto.quantity,
        uomId: dto.uomId,
        clientId: dto.clientId,
        assignedToUserId: dto.assignedToUserId,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
        notes: dto.notes,
      },
    });

    this.eventEmitter.emit('work-order.created', { id: order.id, workOrderNumber, tenantId });
    return order;
  }

  async findAll(tenantId: string, filters?: { status?: string; facilityId?: string; workOrderType?: string }): Promise<any> {
    const where: any = { tenantId };
    if (filters?.status) where.status = filters.status;
    if (filters?.facilityId) where.facilityId = filters.facilityId;
    if (filters?.workOrderType) where.workOrderType = filters.workOrderType;
    return this.prisma.workOrder.findMany({
      where,
      include: {
        operations: { orderBy: { sequenceNumber: 'asc' } },
        components: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, tenantId: string): Promise<any> {
    const order = await this.prisma.workOrder.findFirst({
      where: { id, tenantId },
      include: {
        operations: { orderBy: { sequenceNumber: 'asc' } },
        components: true,
      },
    });
    if (!order) throw new NotFoundException('Work order not found');
    return order;
  }

  async update(id: string, dto: UpdateWorkOrderDto, tenantId: string): Promise<any> {
    await this.findById(id, tenantId);
    const updateData: any = {};
    if (dto.workOrderType !== undefined) updateData.workOrderType = dto.workOrderType;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.productId !== undefined) updateData.productId = dto.productId;
    if (dto.quantity !== undefined) updateData.quantity = dto.quantity;
    if (dto.uomId !== undefined) updateData.uomId = dto.uomId;
    if (dto.clientId !== undefined) updateData.clientId = dto.clientId;
    if (dto.assignedToUserId !== undefined) updateData.assignedToUserId = dto.assignedToUserId;
    if (dto.scheduledDate !== undefined) updateData.scheduledDate = new Date(dto.scheduledDate);
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const updated = await this.prisma.workOrder.update({ where: { id }, data: updateData });
    this.eventEmitter.emit('work-order.updated', { id, tenantId });
    return updated;
  }

  async release(id: string, tenantId: string): Promise<any> {
    const order = await this.findById(id, tenantId);
    if (order.status !== 'DRAFT') throw new BadRequestException('Only DRAFT work orders can be released');
    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: { status: 'RELEASED' },
    });
    this.eventEmitter.emit('work-order.released', { id, workOrderNumber: order.workOrderNumber, tenantId });
    return updated;
  }

  async complete(id: string, tenantId: string): Promise<any> {
    const order = await this.findById(id, tenantId);
    if (!['IN_PROGRESS', 'RELEASED'].includes(order.status)) {
      throw new BadRequestException('Work order must be RELEASED or IN_PROGRESS to complete');
    }
    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
    this.eventEmitter.emit('work-order.completed', { id, workOrderNumber: order.workOrderNumber, tenantId });
    return updated;
  }

  async cancel(id: string, tenantId: string): Promise<any> {
    const order = await this.findById(id, tenantId);
    if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
      throw new BadRequestException('Cannot cancel a completed or already cancelled work order');
    }
    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    this.eventEmitter.emit('work-order.cancelled', { id, workOrderNumber: order.workOrderNumber, tenantId });
    return updated;
  }

  async findByAssignedUser(tenantId: string, userId: string): Promise<any> {
    return this.prisma.workOrder.findMany({
      where: {
        tenantId,
        assignedToUserId: userId,
        status: { in: ['RELEASED', 'IN_PROGRESS'] },
      },
      include: {
        operations: {
          where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
          orderBy: { sequenceNumber: 'asc' },
        },
        components: true,
      },
      orderBy: [{ priority: 'asc' }, { scheduledDate: 'asc' }],
    });
  }
}
