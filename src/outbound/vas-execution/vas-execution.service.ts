import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateVasTaskDto, UpdateVasTaskDto } from './dtos/create-vas-task.dto';

@Injectable()
export class VasExecutionService {
  private readonly logger = new Logger(VasExecutionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createTask(dto: CreateVasTaskDto, tenantId: string): Promise<any> {
    const count = await (this.prisma as any).vasExecutionTask.count({ where: { tenantId } });
    const taskNumber = `VAS-${(count + 1).toString().padStart(6, '0')}`;

    const task = await (this.prisma as any).vasExecutionTask.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        taskNumber,
        taskType: dto.taskType,
        orderId: dto.orderId,
        shipmentId: dto.shipmentId,
        productId: dto.productId,
        quantityRequired: dto.quantityRequired ?? 0,
        uomId: dto.uomId,
        status: dto.status ?? 'PENDING',
        priority: dto.priority ?? 5,
        assignedToUserId: dto.assignedToUserId,
        ratePerUnit: dto.ratePerUnit,
        notes: dto.notes,
      },
    });

    this.eventEmitter.emit('vas.task.created', { taskId: task.id, taskNumber, tenantId });
    return task;
  }

  async findAll(tenantId: string, filters?: { status?: string; facilityId?: string }): Promise<any> {
    const where: any = { tenantId };
    if (filters?.status) where.status = filters.status;
    if (filters?.facilityId) where.facilityId = filters.facilityId;
    return (this.prisma as any).vasExecutionTask.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findById(id: string, tenantId: string): Promise<any> {
    const task = await (this.prisma as any).vasExecutionTask.findFirst({ where: { id, tenantId } });
    if (!task) throw new NotFoundException('VAS task not found');
    return task;
  }

  async updateTask(id: string, dto: UpdateVasTaskDto, tenantId: string): Promise<any> {
    const task = await this.findById(id, tenantId);
    const updateData: any = {};
    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === 'IN_PROGRESS') updateData.startedAt = new Date();
      if (dto.status === 'COMPLETED') updateData.completedAt = new Date();
    }
    if (dto.quantityCompleted !== undefined) updateData.quantityCompleted = dto.quantityCompleted;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.assignedToUserId !== undefined) updateData.assignedToUserId = dto.assignedToUserId;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const updated = await (this.prisma as any).vasExecutionTask.update({
      where: { id },
      data: updateData,
    });

    this.eventEmitter.emit('vas.task.updated', { taskId: id, status: dto.status, tenantId });
    return updated;
  }

  async deleteTask(id: string, tenantId: string): Promise<void> {
    await this.findById(id, tenantId);
    await (this.prisma as any).vasExecutionTask.delete({ where: { id } });
  }

  async addEvent(taskId: string, eventType: string, payload: string, userId: string | undefined, tenantId: string): Promise<any> {
    await this.findById(taskId, tenantId);
    return (this.prisma as any).vasTaskEvent.create({
      data: {
        tenantId,
        vasTaskId: taskId,
        eventType,
        eventPayload: payload,
        recordedBy: userId,
      },
    });
  }

  async getEvents(taskId: string, tenantId: string): Promise<any> {
    await this.findById(taskId, tenantId);
    return (this.prisma as any).vasTaskEvent.findMany({
      where: { vasTaskId: taskId, tenantId },
      orderBy: { recordedAt: 'asc' },
    });
  }
}
