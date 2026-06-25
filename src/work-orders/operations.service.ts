import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateOperationDto, UpdateOperationDto } from './dtos/create-work-order.dto';

@Injectable()
export class OperationsService {
  private readonly logger = new Logger(OperationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async addOperation(workOrderId: string, dto: CreateOperationDto, tenantId: string): Promise<any> {
    const order = await this.prisma.workOrder.findFirst({ where: { id: workOrderId, tenantId } });
    if (!order) throw new NotFoundException('Work order not found');
    if (order.status !== 'DRAFT') throw new BadRequestException('Can only add operations to DRAFT work orders');

    const operation = await this.prisma.workOrderOperation.create({
      data: {
        tenantId,
        workOrderId,
        sequenceNumber: dto.sequenceNumber,
        operationName: dto.operationName,
        operationType: dto.operationType,
        assignedToUserId: dto.assignedToUserId,
        estimatedMinutes: dto.estimatedMinutes,
        notes: dto.notes,
      },
    });

    this.eventEmitter.emit('work-order.operation.added', { workOrderId, operationId: operation.id, tenantId });
    return operation;
  }

  async updateOperation(workOrderId: string, opId: string, dto: UpdateOperationDto, tenantId: string): Promise<any> {
    const op = await this.prisma.workOrderOperation.findFirst({
      where: { id: opId, workOrderId, tenantId },
    });
    if (!op) throw new NotFoundException('Operation not found');

    const updateData: any = {};
    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === 'IN_PROGRESS') updateData.startedAt = new Date();
      if (dto.status === 'COMPLETED') updateData.completedAt = new Date();
    }
    if (dto.actualMinutes !== undefined) updateData.actualMinutes = dto.actualMinutes;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const updated = await this.prisma.workOrderOperation.update({
      where: { id: opId },
      data: updateData,
    });

    this.eventEmitter.emit('work-order.operation.updated', { workOrderId, operationId: opId, status: dto.status, tenantId });
    return updated;
  }

  async startOperation(workOrderId: string, opId: string, tenantId: string): Promise<any> {
    return this.updateOperation(workOrderId, opId, { status: 'IN_PROGRESS' }, tenantId);
  }

  async completeOperation(workOrderId: string, opId: string, tenantId: string, actualMinutes?: number): Promise<any> {
    const op = await this.prisma.workOrderOperation.findFirst({
      where: { id: opId, workOrderId, tenantId },
    });
    if (!op) throw new NotFoundException('Operation not found');
    if (op.status !== 'IN_PROGRESS') throw new BadRequestException('Operation must be IN_PROGRESS to complete');

    const dto: UpdateOperationDto = { status: 'COMPLETED' };
    if (actualMinutes !== undefined) dto.actualMinutes = actualMinutes;
    return this.updateOperation(workOrderId, opId, dto, tenantId);
  }
}
