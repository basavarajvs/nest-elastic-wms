import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class WarehouseEventService {
  private readonly logger = new Logger(WarehouseEventService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async publish(params: {
    tenantId: string;
    facilityId?: string;
    eventType: string;
    entityType: string;
    entityId: string;
    eventData?: any;
    source?: string;
    performedByUserId?: string;
  }): Promise<any> {
    const event = await this.prisma.warehouseEvent.create({
      data: {
        tenantId: params.tenantId,
        facilityId: params.facilityId,
        eventType: params.eventType,
        entityType: params.entityType,
        entityId: params.entityId,
        eventData: params.eventData ?? undefined,
        source: params.source ?? 'SYSTEM',
        performedByUserId: params.performedByUserId,
      },
    });

    this.eventEmitter.emit('warehouse.event', event);
    this.eventEmitter.emit(`warehouse.event.${params.eventType}`, event);

    return event;
  }

  async findById(id: string, tenantId: string): Promise<any> {
    return this.prisma.warehouseEvent.findFirst({
      where: { id, tenantId },
    });
  }

  async findAll(tenantId: string, filters?: {
    eventType?: string;
    entityType?: string;
    entityId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: any[]; total: number }> {
    const where: any = { tenantId };
    if (filters?.eventType) where.eventType = filters.eventType;
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.entityId) where.entityId = filters.entityId;
    if (filters?.startDate || filters?.endDate) {
      where.occurredAt = {};
      if (filters.startDate) where.occurredAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.occurredAt.lte = new Date(filters.endDate);
    }

    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    const [items, total] = await Promise.all([
      this.prisma.warehouseEvent.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        take: Math.min(limit, 200),
        skip: offset,
      }),
      this.prisma.warehouseEvent.count({ where }),
    ]);

    return { items, total };
  }
}
