import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AllocationService } from './allocation.service';
import { CreateWaveDto, UpdateWaveStatusDto } from './dtos/wave.dto';

@Injectable()
export class WaveService {
  private readonly logger = new Logger(WaveService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly eventEmitter: EventEmitter2,
    private readonly allocationService: AllocationService,
  ) {}

  async create(dto: CreateWaveDto, tenantId: string): Promise<any> {
    const count = await (this.prisma as any).pickingWave.count({
      where: { tenantId, facilityId: dto.facilityId },
    });
    const waveNumber = `WV-${dto.facilityId.slice(0, 4).toUpperCase()}-${(count + 1).toString().padStart(4, '0')}`;

    const criteria: any = dto.selectionCriteria || {};
    if (dto.orderIds?.length) {
      criteria.orderIds = dto.orderIds;
    }

    return (this.prisma as any).pickingWave.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        waveNumber,
        selectionCriteria: criteria,
      },
    });
  }

  async releaseWave(waveId: string, tenantId: string): Promise<any> {
    const wave = await (this.prisma as any).pickingWave.findFirst({
      where: { id: waveId, tenantId },
    });
    if (!wave) throw new BadRequestException('Wave not found');

    const criteria = (wave.selectionCriteria as any) || {};
    const orderFilter: any = {
      tenantId,
      facilityId: wave.facilityId,
      status: 'ALLOCATED',
    };
    if (criteria.orderIds?.length) {
      orderFilter.id = { in: criteria.orderIds };
    }
    if (criteria.clientCode) {
      orderFilter.clientCode = criteria.clientCode;
    }
    const orders = await (this.prisma as any).salesOrder.findMany({
      where: orderFilter,
      include: {
        lines: {
          where: { status: 'ALLOCATED' },
          include: { allocations: { where: { status: 'HARD_ALLOCATED' } } },
        },
      },
    });

    let totalTasks = 0;
    const taskBatch: Array<{
      data: any;
      location?: any;
    }> = [];

    for (const order of orders) {
      for (const line of order.lines) {
        for (const alloc of line.allocations) {
          const location = await (this.prisma as any).storageLocation.findFirst({
            where: { id: alloc.locationId, tenantId },
            include: { zone: true },
          });

          const zoneType = location?.zone?.zoneType || 'ZZZ';
          const zoneCode = location?.zone?.zoneCode || 'ZZ';
          const pickSeq = (location?.attributes as any)?.pickSequence || 0;

          taskBatch.push({
            data: {
              tenantId,
              facilityId: wave.facilityId,
              orderLineId: line.id,
              productId: line.productId,
              locationId: alloc.locationId,
              lotId: alloc.lotId,
              quantityToPick: alloc.quantityAllocated,
              uomId: alloc.uomId,
              status: 'CREATED',
            },
            location,
          });
        }
      }
    }

    taskBatch.sort((a, b) => {
      const aZone = a.location?.zone?.zoneType || 'ZZZ';
      const bZone = b.location?.zone?.zoneType || 'ZZZ';
      if (aZone !== bZone) return aZone.localeCompare(bZone);
      const aLoc = a.location?.locationCode || '';
      const bLoc = b.location?.locationCode || '';
      return aLoc.localeCompare(bLoc);
    });

    for (let i = 0; i < taskBatch.length; i++) {
      const entry = taskBatch[i];
      const taskCount = await (this.prisma as any).pickingTask.count({
        where: { tenantId, facilityId: wave.facilityId },
      });
      const taskNumber = `PK-${wave.facilityId.slice(0, 4).toUpperCase()}-${(taskCount + 1).toString().padStart(6, '0')}`;

      await (this.prisma as any).pickingTask.create({
        data: {
          ...entry.data,
          taskNumber,
          waveId,
          sequenceNumber: i + 1,
        },
      });
      totalTasks++;
    }

    for (const order of orders) {
      for (const line of order.lines) {
        await (this.prisma as any).salesOrderLine.update({
          where: { id: line.id },
          data: { status: 'RELEASED' },
        });
      }
    }

    await (this.prisma as any).pickingWave.update({
      where: { id: waveId },
      data: { status: 'RELEASED', totalTasks, releasedAt: new Date() },
    });

    this.eventEmitter.emit('wave.released', { waveId, orders: orders.length, tasks: totalTasks, tenantId });
    return { waveId, ordersProcessed: orders.length, tasksGenerated: totalTasks };
  }

  async updateStatus(waveId: string, dto: UpdateWaveStatusDto, tenantId: string): Promise<any> {
    const wave = await (this.prisma as any).pickingWave.findFirst({
      where: { id: waveId, tenantId },
    });
    if (!wave) throw new BadRequestException('Wave not found');

    return (this.prisma as any).pickingWave.update({
      where: { id: waveId },
      data: { status: dto.status },
    });
  }

  async getBoard(tenantId: string, filters: {
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
      (this.prisma as any).pickingWave.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).pickingWave.count({ where }),
    ]);
    return { data, total };
  }
}
