import { Injectable, Logger, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VasCatalogService } from '../vas-catalog/vas-catalog.service';
import { CreateVasTaskDto, UpdateVasTaskDto } from './dtos/create-vas-task.dto';

@Injectable()
export class VasExecutionService {
  private readonly logger = new Logger(VasExecutionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => VasCatalogService))
    private readonly catalogService: VasCatalogService,
  ) {}

  async createTask(dto: CreateVasTaskDto, tenantId: string): Promise<any> {
    const count = await this.prisma.vasExecutionTask.count({ where: { tenantId } });
    const taskNumber = `VAS-${(count + 1).toString().padStart(6, '0')}`;

    let ratePerUnit = dto.ratePerUnit;
    let totalCharge: number | undefined;

    if (dto.serviceId) {
      const services = await this.catalogService.findServicesByIds([dto.serviceId], tenantId);
      if (services.length === 0) throw new BadRequestException('VAS service not found in catalog');

      const rate = await this.catalogService.lookupRate(dto.serviceId, dto.clientId, tenantId);
      if (rate.ratePerUnit !== null) {
        ratePerUnit = rate.ratePerUnit;
        totalCharge = (dto.quantityRequired ?? 0) * rate.ratePerUnit;
      }
    }

    const task = await this.prisma.vasExecutionTask.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        taskNumber,
        taskType: dto.taskType,
        serviceId: dto.serviceId,
        clientId: dto.clientId,
        orderId: dto.orderId,
        shipmentId: dto.shipmentId,
        productId: dto.productId,
        quantityRequired: dto.quantityRequired ?? 0,
        uomId: dto.uomId,
        status: dto.status ?? 'PENDING',
        priority: dto.priority ?? 5,
        assignedToUserId: dto.assignedToUserId,
        ratePerUnit: ratePerUnit ?? undefined,
        totalCharge,
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
    return this.prisma.vasExecutionTask.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findById(id: string, tenantId: string): Promise<any> {
    const task = await this.prisma.vasExecutionTask.findFirst({ where: { id, tenantId } });
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
    if (dto.quantityCompleted !== undefined) {
      updateData.quantityCompleted = dto.quantityCompleted;
      if (task.ratePerUnit) {
        updateData.totalCharge = Number(dto.quantityCompleted) * Number(task.ratePerUnit);
      }
    }
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.assignedToUserId !== undefined) updateData.assignedToUserId = dto.assignedToUserId;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const updated = await this.prisma.vasExecutionTask.update({
      where: { id },
      data: updateData,
    });

    this.eventEmitter.emit('vas.task.updated', { taskId: id, status: dto.status, tenantId });
    return updated;
  }

  async deleteTask(id: string, tenantId: string): Promise<void> {
    await this.findById(id, tenantId);
    await this.prisma.vasExecutionTask.delete({ where: { id } });
  }

  async addEvent(taskId: string, eventType: string, payload: string, userId: string | undefined, tenantId: string): Promise<any> {
    await this.findById(taskId, tenantId);
    return this.prisma.vasTaskEvent.create({
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
    return this.prisma.vasTaskEvent.findMany({
      where: { vasTaskId: taskId, tenantId },
      orderBy: { recordedAt: 'asc' },
    });
  }
}
