import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfirmPickDto, PickRecoverDto } from './dtos/picking.dto';

@Injectable()
export class PickingService {
  private readonly logger = new Logger(PickingService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getNextTask(tenantId: string, userId: string): Promise<any> {
    const task = await (this.prisma as any).pickingTask.findFirst({
      where: { tenantId, assignedToUserId: userId, status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
      orderBy: [{ sequenceNumber: 'asc' }, { priority: 'asc' }],
    });
    if (!task) return null;

    const location = await (this.prisma as any).storageLocation.findFirst({
      where: { id: task.locationId, tenantId },
    });
    const product = await (this.prisma as any).product.findFirst({
      where: { id: task.productId, tenantId },
    });

    await this.redis.set(`wms:rf:pick:${task.id}:${userId}`, JSON.stringify({
      taskId: task.id,
      status: 'IN_PROGRESS',
      lastConfirmedQty: task.quantityPicked,
      timestamp: Date.now(),
    }), 'EX', 3600);

    return {
      taskNumber: task.taskNumber,
      locationCode: location?.locationCode,
      productSku: product?.sku,
      productName: product?.name,
      lotNumber: task.lotId,
      quantityToPick: task.quantityToPick,
      quantityPicked: task.quantityPicked,
      uom: task.uomId,
      sequenceNumber: task.sequenceNumber,
    };
  }

  async confirmPick(dto: ConfirmPickDto, tenantId: string, userId: string): Promise<any> {
    const task = await (this.prisma as any).pickingTask.findFirst({
      where: { id: dto.taskId, tenantId },
    });
    if (!task) throw new BadRequestException('Task not found');
    if (!['ASSIGNED', 'IN_PROGRESS'].includes(task.status)) {
      throw new BadRequestException('Task is not in pickable state');
    }

    return (this.prisma as any).$transaction(async (tx: any) => {
      const newPicked = task.quantityPicked + dto.actualQuantity;
      const isShort = newPicked < task.quantityToPick;
      const isComplete = newPicked >= task.quantityToPick;

      const taskStatus = isComplete ? 'COMPLETED' : 'SHORT';
      await tx.pickingTask.update({
        where: { id: dto.taskId },
        data: {
          quantityPicked: newPicked,
          status: taskStatus,
          completedAt: isComplete ? new Date() : null,
          exceptionNotes: dto.exceptionNotes,
        },
      });

      if (dto.lotNumber || task.lotId) {
        const lotId = dto.lotNumber || task.lotId;
        await tx.inventoryOnHand.updateMany({
          where: {
            tenantId,
            facilityId: task.facilityId,
            productId: task.productId,
            locationId: task.locationId,
            quantityOnHand: { gte: dto.actualQuantity },
          },
          data: {
            quantityOnHand: { decrement: dto.actualQuantity },
            quantityPicked: { increment: dto.actualQuantity },
          },
        });
      }

      const lpnNumber = `PICK-${task.taskNumber}-${Date.now()}`;
      await tx.lPN.upsert({
        where: { lpn_number_uq: { tenantId, lpnNumber } },
        update: { quantity: { increment: dto.actualQuantity } },
        create: {
          tenantId,
          facilityId: task.facilityId,
          lpnNumber,
          lpnType: 'CASE',
          status: 'CONSUMED',
          locationId: task.locationId,
          productId: task.productId,
          quantity: dto.actualQuantity,
          uomId: task.uomId,
        },
      });

      const lineStatus = isShort ? 'SHORT' : 'PICKED';
      await tx.salesOrderLine.update({
        where: { id: task.orderLineId },
        data: {
          fulfilledQuantity: { increment: dto.actualQuantity },
          status: lineStatus,
        },
      });

      if (isShort) {
        const backorderQty = task.quantityToPick - newPicked;
        await tx.salesOrderLine.update({
          where: { id: task.orderLineId },
          data: { status: 'BACKORDERED' },
        });
      }

      this.eventEmitter.emit('picking.completed', { taskId: dto.taskId, orderLineId: task.orderLineId, tenantId });

      if (task.waveId) {
        const waveTasks = await tx.pickingTask.findMany({
          where: { waveId: task.waveId, tenantId },
        });
        const completedCount = waveTasks.filter((t: any) => t.status === 'COMPLETED').length;
        await tx.pickingWave.update({
          where: { id: task.waveId },
          data: { completedTasks: completedCount },
        });
      }

      const nextTask = isComplete ? await this.getNextTask(tenantId, userId) : null;
      return { status: taskStatus, quantityPicked: newPicked, nextTask };
    });
  }

  async assignTask(taskId: string, userId: string, tenantId: string): Promise<any> {
    const lockKey = `pick:lock:${taskId}`;
    const lock = await this.redis.set(lockKey, userId, 'EX', 600, 'NX');
    if (!lock) throw new BadRequestException('Task is already assigned');

    try {
      return (this.prisma as any).pickingTask.update({
        where: { id: taskId },
        data: { assignedToUserId: userId, status: 'IN_PROGRESS', assignedAt: new Date() },
      });
    } catch {
      this.redis.del(lockKey).catch(() => {});
      throw new BadRequestException('Failed to assign task');
    }
  }

  async recoverPickSession(dto: PickRecoverDto, tenantId: string): Promise<any> {
    const cacheKey = `wms:rf:pick:${dto.taskId}:${dto.userId}`;
    const cached = await this.redis.get(cacheKey);
    if (!cached) throw new BadRequestException('No recovery state found');

    const state = JSON.parse(cached);
    const task = await (this.prisma as any).pickingTask.findFirst({
      where: { id: dto.taskId, tenantId },
    });
    if (!task) throw new BadRequestException('Task not found');

    if (task.quantityPicked !== state.lastConfirmedQty) {
      throw new BadRequestException('Pick state mismatch. Manual reconciliation required.');
    }

    return {
      taskId: task.id,
      taskNumber: task.taskNumber,
      quantityToPick: task.quantityToPick,
      quantityPicked: task.quantityPicked,
      status: task.status,
    };
  }

  async scanLocation(taskId: string, scannedLocationId: string, tenantId: string): Promise<boolean> {
    const task = await (this.prisma as any).pickingTask.findFirst({
      where: { id: taskId, tenantId },
    });
    if (!task) throw new BadRequestException('Task not found');
    return task.locationId === scannedLocationId;
  }
}
