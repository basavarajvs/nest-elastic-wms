import { Injectable, Logger, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common/cache/redis.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ScheduleCountDto, SubmitCountLineDto, AdhocCountDto, BatchSubmitLinesDto } from './dtos/count.dto';

@Injectable()
export class CycleCountService {
  private readonly logger = new Logger(CycleCountService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async schedule(dto: ScheduleCountDto, tenantId: string): Promise<any> {
    const count = await (this.prisma as any).cycleCount.count({
      where: { tenantId, facilityId: dto.facilityId },
    });
    const countNumber = `CC-${dto.facilityId.slice(0, 4).toUpperCase()}-${(count + 1).toString().padStart(6, '0')}`;

    const items = await this.resolveScope(dto, tenantId);
    const countRec = await (this.prisma as any).cycleCount.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        countNumber,
        countMethod: dto.countMethod,
        scopeType: dto.scopeType,
        scopeIdentifier: dto.scopeIdentifier,
        frequencyType: dto.frequencyType || 'MANUAL',
        autoAdjust: dto.autoAdjust ?? false,
        lines: {
          create: items.map((item: any) => ({
            tenantId,
            facilityId: dto.facilityId,
            productId: item.productId,
            locationId: item.locationId,
            lotId: item.lotId,
            uomId: item.uomId,
            systemQuantity: item.quantityOnHand || 0,
          })),
        },
      },
      include: { lines: true },
    });

    for (const line of countRec.lines) {
      await this.freezeLocation(line.locationId, tenantId);
    }

    return countRec;
  }

  private async resolveScope(dto: ScheduleCountDto, tenantId: string): Promise<any[]> {
    if (dto.scopeType === 'ABC_CLASS') {
      const abcClass = dto.scopeIdentifier || 'A';
      return (this.prisma as any).$queryRawUnsafe(`
        SELECT ioh.* FROM multitenant.inventory_on_hand ioh
        JOIN multitenant.products p ON p.id = ioh.product_id
        WHERE ioh.tenant_id = $1::uuid
          AND ioh.facility_id = $2::uuid
          AND p.velocity_class = $3
          AND ioh.quantity_on_hand > 0
        ORDER BY p.updated_at ASC
        LIMIT 200
      `, tenantId, dto.facilityId, abcClass);
    }
    if (dto.scopeType === 'ZONE') {
      return (this.prisma as any).inventoryOnHand.findMany({
        where: { tenantId, facilityId: dto.facilityId },
        include: { lot: true },
        take: 200,
      });
    }
    return (this.prisma as any).inventoryOnHand.findMany({
      where: { tenantId, facilityId: dto.facilityId, quantityOnHand: { gt: 0 } },
      take: 200,
    });
  }

  async assign(countId: string, userId: string, tenantId: string): Promise<any> {
    const lockKey = `count:lock:${countId}:${userId}`;
    const lock = await this.redis.set(lockKey, userId, 'EX', 7200, 'NX');
    if (!lock) throw new BadRequestException('Count already assigned');

    try {
      return (this.prisma as any).cycleCount.update({
        where: { id: countId },
        data: { assignedToUserId: userId, status: 'ASSIGNED' },
      });
    } catch {
      this.redis.del(lockKey).catch(() => {});
      throw new BadRequestException('Failed to assign count');
    }
  }

  async submitLine(dto: SubmitCountLineDto, tenantId: string): Promise<any> {
    const line = await (this.prisma as any).cycleCountLine.findFirst({
      where: { id: dto.lineId, tenantId },
      include: { count: true },
    });
    if (!line) throw new BadRequestException('Count line not found');
    if (line.status !== 'PENDING') throw new BadRequestException('Line already counted');

    const lockKey = `count:line:${dto.lineId}`;
    const lock = await this.redis.set(lockKey, '1', 'EX', 30, 'NX');
    if (!lock) throw new BadRequestException('409 AlreadyCounted');

    try {
      const variance = dto.countedQuantity - line.systemQuantity;
      const count = await (this.prisma as any).cycleCountLine.update({
        where: { id: dto.lineId },
        data: {
          countedQuantity: dto.countedQuantity,
          varianceQuantity: variance,
          status: 'COUNTED',
          countedByUserId: line.count?.assignedToUserId,
          countedAt: new Date(),
        },
      });

      this.eventEmitter.emit('count.line.counted', { lineId: dto.lineId, variance, tenantId });
      return count;
    } finally {
      this.redis.del(lockKey).catch(() => {});
    }
  }

  async finalizeCount(countId: string, tenantId: string): Promise<any> {
    const count = await (this.prisma as any).cycleCount.findFirst({
      where: { id: countId, tenantId },
      include: { lines: true },
    });
    if (!count) throw new BadRequestException('Count not found');

    const allCounted = count.lines.every((l: any) => l.status === 'COUNTED');
    if (!allCounted) throw new BadRequestException('Not all lines have been counted');

    const config = await this.getThresholdConfig(tenantId);
    const autoThreshold = config?.autoThreshold ?? 100;
    const supervisorThreshold = config?.supervisorThreshold ?? 1000;

    for (const line of count.lines) {
      const varianceValue = Math.abs(line.varianceQuantity || 0) * 10;

      if (count.autoAdjust && varianceValue <= autoThreshold) {
        await this.postAdjustment(line, tenantId);
      } else if (varianceValue <= supervisorThreshold) {
        await (this.prisma as any).adjustmentApproval.create({
          data: {
            tenantId,
            facilityId: count.facilityId,
            countLineId: line.id,
            varianceValue,
            varianceQty: Math.abs(line.varianceQuantity || 0),
            approvalLevel: 'SUPERVISOR',
            requestedByUserId: count.assignedToUserId || 'SYSTEM',
            thresholdVersion: config?.version || '1.0',
          },
        });
      } else {
        await (this.prisma as any).adjustmentApproval.create({
          data: {
            tenantId,
            facilityId: count.facilityId,
            countLineId: line.id,
            varianceValue,
            varianceQty: Math.abs(line.varianceQuantity || 0),
            approvalLevel: 'MANAGER',
            requestedByUserId: count.assignedToUserId || 'SYSTEM',
            thresholdVersion: config?.version || '1.0',
          },
        });
      }
    }

    const result = await (this.prisma as any).cycleCount.update({
      where: { id: countId },
      data: { status: 'RECONCILED', completedAt: new Date() },
    });

    await this.releaseFrozenLocations(countId, tenantId);

    this.eventEmitter.emit('count.completed', { countId, tenantId });
    return result;
  }

  private async postAdjustment(line: any, tenantId: string): Promise<void> {
    const variance = (line.countedQuantity || 0) - line.systemQuantity;
    if (Math.abs(variance) < 0.001) return;

    const txnType = variance > 0 ? 'ADJUSTMENT_INCREASE' : 'ADJUSTMENT_DECREASE';
    await (this.prisma as any).inventoryTransaction.create({
      data: {
        tenantId,
        facilityId: line.facilityId,
        productId: line.productId,
        locationId: line.locationId,
        lotId: line.lotId,
        transactionType: txnType,
        quantity: Math.abs(variance),
        quantityBefore: line.systemQuantity,
        quantityAfter: line.countedQuantity || 0,
        uomId: line.uomId,
        referenceType: 'CYCLE_COUNT',
        referenceId: line.countId,
        reasonCode: 'CYCLE_COUNT_AUTO_ADJUST',
      },
    });

    await (this.prisma as any).inventoryOnHand.updateMany({
      where: { tenantId, facilityId: line.facilityId, productId: line.productId, locationId: line.locationId },
      data: { quantityOnHand: { increment: variance } },
    });
  }

  private async getThresholdConfig(tenantId: string): Promise<any> {
    return (this.prisma as any).approvalThresholdConfig.findFirst({
      where: { tenantId, active: true },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async freezeLocation(locationId: string, tenantId: string): Promise<void> {
    await (this.prisma as any).inventoryHold.create({
      data: {
        tenantId,
        facilityId: '',
        productId: null,
        locationId,
        holdType: 'CYCLE_COUNT',
        reason: 'Location frozen during cycle count',
        placedByUserId: 'SYSTEM',
      },
    });
  }

  async releaseFrozenLocations(countId: string, tenantId: string): Promise<void> {
    const lines = await (this.prisma as any).cycleCountLine.findMany({
      where: { countId, tenantId },
    });
    for (const line of lines) {
      await (this.prisma as any).inventoryHold.updateMany({
        where: { locationId: line.locationId, tenantId, holdType: 'CYCLE_COUNT', status: 'ACTIVE' },
        data: { status: 'RELEASED', releasedAt: new Date() },
      });
    }
  }

  async adhocCount(dto: AdhocCountDto, tenantId: string): Promise<any> {
    const items = await (this.prisma as any).inventoryOnHand.findMany({
      where: {
        tenantId,
        facilityId: dto.facilityId,
        locationId: { in: dto.locationIds },
        quantityOnHand: { gt: 0 },
      },
      take: 500,
    });

    if (items.length === 0) throw new BadRequestException('No inventory found at the specified locations');

    const count = await (this.prisma as any).cycleCount.count({
      where: { tenantId, facilityId: dto.facilityId },
    });
    const countNumber = `ADHOC-${dto.facilityId.slice(0, 4).toUpperCase()}-${(count + 1).toString().padStart(6, '0')}`;

    const countRec = await (this.prisma as any).cycleCount.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        countNumber,
        countMethod: dto.countMethod,
        scopeType: dto.scopeType,
        scopeIdentifier: dto.scopeIdentifier,
        frequencyType: 'MANUAL',
        autoAdjust: dto.autoAdjust ?? false,
        lines: {
          create: items.map((item: any) => ({
            tenantId,
            facilityId: dto.facilityId,
            productId: item.productId,
            locationId: item.locationId,
            lotId: item.lotId,
            uomId: item.uomId,
            systemQuantity: dto.countMethod === 'BLIND' ? 0 : (item.quantityOnHand || 0),
          })),
        },
      },
      include: { lines: true },
    });

    for (const line of countRec.lines) {
      await this.freezeLocation(line.locationId, tenantId);
    }

    return countRec;
  }

  async batchSubmitLines(dto: BatchSubmitLinesDto, tenantId: string): Promise<any> {
    const results: any[] = [];
    const errors: string[] = [];

    for (const line of dto.lines) {
      try {
        const result = await this.submitLine({ lineId: line.lineId, countedQuantity: line.countedQuantity }, tenantId);
        results.push(result);
      } catch (err: any) {
        errors.push(`Line ${line.lineId}: ${err.message}`);
      }
    }

    return { submitted: results.length, errors };
  }

  async getSummary(tenantId: string, facilityId?: string): Promise<any> {
    const where: any = { tenantId };
    if (facilityId) where.facilityId = facilityId;

    const total = await (this.prisma as any).cycleCount.count({ where });
    const byStatus = await (this.prisma as any).cycleCount.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });
    const byMethod = await (this.prisma as any).cycleCount.groupBy({
      by: ['countMethod'],
      where,
      _count: { id: true },
    });

    const completed = await (this.prisma as any).cycleCount.findMany({
      where: { ...where, status: 'RECONCILED' },
      select: { lines: { select: { varianceQuantity: true, systemQuantity: true } } },
    });

    let totalVariance = 0;
    let totalLines = 0;
    for (const c of completed) {
      for (const line of c.lines) {
        totalVariance += Math.abs(line.varianceQuantity || 0);
        totalLines++;
      }
    }

    return {
      total,
      byStatus: byStatus.reduce((acc: any, s: any) => ({ ...acc, [s.status]: s._count.id }), {}),
      byMethod: byMethod.reduce((acc: any, m: any) => ({ ...acc, [m.countMethod]: m._count.id }), {}),
      averageVariance: totalLines > 0 ? (totalVariance / totalLines).toFixed(2) : 0,
    };
  }

  async getCountLines(countId: string, tenantId: string): Promise<any> {
    const count = await (this.prisma as any).cycleCount.findFirst({
      where: { id: countId, tenantId },
    });
    if (!count) throw new NotFoundException('Count not found');

    const lines = await (this.prisma as any).cycleCountLine.findMany({
      where: { countId, tenantId },
      orderBy: { createdAt: 'asc' },
    });

    if (count.countMethod === 'BLIND') {
      return lines.map((l: any) => ({
        ...l,
        systemQuantity: 0,
      }));
    }
    return lines;
  }

  async list(tenantId: string, filters: {
    status?: string;
    facilityId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    const where: any = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.facilityId) where.facilityId = filters.facilityId;
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 200);
    const [data, total] = await Promise.all([
      (this.prisma as any).cycleCount.findMany({
        where, skip: (page - 1) * limit, take: limit,
        include: { lines: true },
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).cycleCount.count({ where }),
    ]);
    return { data, total };
  }
}
