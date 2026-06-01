import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InventoryTransactionService } from '../inventory/inventory-transaction.service';
import { InventoryPolicyService } from '../inventory/inventory-policy.service';

@Injectable()
export class PutawayService {
  private readonly logger = new Logger(PutawayService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly eventEmitter: EventEmitter2,
    private readonly txnService: InventoryTransactionService,
    private readonly policyService: InventoryPolicyService,
  ) {}

  async generateTasks(grnId: string, tenantId: string): Promise<any[]> {
    const lockKey = `putaway:gen:${grnId}`;
    const lock = await this.redis.set(lockKey, 'LOCK', 'EX', 10, 'NX');
    if (!lock) {
      this.logger.warn(`Putaway generation already in progress for GRN ${grnId}`);
      return [];
    }
    try {
      const grn = await (this.prisma as any).goodsReceipt.findFirst({
        where: { id: grnId, tenantId },
        include: {
          lines: {
            where: { status: { in: ['RECEIVED', 'QC_PASSED', 'PUTAWAY_PENDING'] } },
          },
        },
      });
      if (!grn) throw new BadRequestException('GRN not found');

      const tasks: any[] = [];
      for (const line of grn.lines) {
        const lpns = await (this.prisma as any).lPN.findMany({
          where: { grnLineId: line.id, tenantId, status: { in: ['RECEIVED', 'IN_STAGING', 'PUTAWAY_PENDING'] } },
        });
        for (const lpn of lpns) {
          const policies = await this.policyService.findByProduct(tenantId, line.productId, grn.facilityId);
          const suggestedLocationId = policies.length > 0 ? policies[0].locationId || null : null;

          const taskCount = await (this.prisma as any).putawayTask.count({
            where: { tenantId, facilityId: grn.facilityId },
          });
          const taskNumber = `PUT-${grn.facilityId.slice(0, 4).toUpperCase()}-${(taskCount + 1).toString().padStart(6, '0')}`;

          const task = await (this.prisma as any).putawayTask.create({
            data: {
              tenantId,
              facilityId: grn.facilityId,
              taskNumber,
              grnLineId: line.id,
              lpnId: lpn.id,
              productId: line.productId,
              quantity: lpn.quantity,
              uomId: line.uomId,
              suggestedLocationId,
              status: 'CREATED',
              priority: line.status === 'QC_PASSED' ? 3 : 5,
            },
          });
          tasks.push(task);
        }
      }
      this.logger.log(`Generated ${tasks.length} putaway tasks for GRN ${grnId}`);
      return tasks;
    } finally {
      this.redis.del(lockKey).catch(() => {});
    }
  }

  async assignTask(taskId: string, userId: string, tenantId: string): Promise<any> {
    const lockKey = `putaway:lock:${taskId}`;
    const lock = await this.redis.set(lockKey, userId, 'EX', 600, 'NX');
    if (!lock) throw new BadRequestException('Task is already assigned to another user');

    try {
      return (this.prisma as any).putawayTask.update({
        where: { id: taskId },
        data: { assignedToUserId: userId, status: 'ASSIGNED' },
      });
    } catch {
      this.redis.del(lockKey).catch(() => {});
      throw new BadRequestException('Failed to assign task');
    }
  }

  async confirmPutaway(taskId: string, confirmedLocationId: string, tenantId: string, overridePin?: string): Promise<any> {
    return (this.prisma as any).$transaction(async (tx: any) => {
      const task = await tx.putawayTask.findFirst({
        where: { id: taskId, tenantId },
      });
      if (!task || task.status === 'COMPLETED') throw new BadRequestException('Task not found or already completed');

      const location = await tx.storageLocation.findFirst({
        where: { id: confirmedLocationId, tenantId },
      });
      if (!location) throw new BadRequestException('Invalid location code');

      const suggested = task.suggestedLocationId;
      if (suggested && suggested !== confirmedLocationId && !overridePin) {
        throw new BadRequestException('LOCATION_MISMATCH');
      }

      await tx.putawayTask.update({
        where: { id: taskId },
        data: { status: 'COMPLETED', assignedLocationId: confirmedLocationId },
      });

      const lpn = await tx.lPN.update({
        where: { id: task.lpnId },
        data: { locationId: confirmedLocationId, status: 'STORED' },
      });

      const lot = lpn.lotNumber
        ? await tx.inventoryLot.findFirst({ where: { lotNumber: lpn.lotNumber, tenantId, facilityId: task.facilityId, productId: task.productId } })
        : null;
      const lotId = lot?.id || '00000000-0000-0000-0000-000000000000';

      await tx.inventoryOnHand.upsert({
        where: {
          inventory_on_hand_uq: {
            tenantId,
            facilityId: task.facilityId,
            productId: task.productId,
            locationId: confirmedLocationId,
            lotId,
          },
        },
        update: { quantityOnHand: { increment: task.quantity } },
        create: {
          tenantId,
          facilityId: task.facilityId,
          productId: task.productId,
          locationId: confirmedLocationId,
          lotId,
          quantityOnHand: task.quantity,
          uomId: task.uomId,
        },
      });

      this.eventEmitter.emit('putaway.completed', { taskId, lpnId: task.lpnId, tenantId });
      return { status: 'COMPLETED', locationCode: location.locationCode, lpnNumber: lpn.lpnNumber };
    });
  }

  async getNextTask(tenantId: string, userId: string): Promise<any> {
    return (this.prisma as any).putawayTask.findFirst({
      where: { tenantId, assignedToUserId: userId, status: 'ASSIGNED' },
      orderBy: { priority: 'asc' },
    });
  }

  async updateTaskStatus(taskId: string, status: string, tenantId: string): Promise<any> {
    const task = await (this.prisma as any).putawayTask.findFirst({
      where: { id: taskId, tenantId },
    });
    if (!task) throw new BadRequestException('Putaway task not found');
    return (this.prisma as any).putawayTask.update({
      where: { id: taskId },
      data: { status },
    });
  }

  async getTaskBoard(tenantId: string, filters: {
    status?: string;
    assignedToUserId?: string;
    priority?: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    const where: any = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.assignedToUserId) where.assignedToUserId = filters.assignedToUserId;
    if (filters.priority) where.priority = filters.priority;

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 200);
    const [data, total] = await Promise.all([
      (this.prisma as any).putawayTask.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      }),
      (this.prisma as any).putawayTask.count({ where }),
    ]);
    return { data, total };
  }
}
