import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async write(params: {
    tenantId: string;
    facilityId?: string;
    action: string;
    entityType: string;
    entityId: string;
    oldValue?: any;
    newValue?: any;
    changedByUserId?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<any> {
    try {
      return await this.prisma.systemAuditLog.create({
        data: {
          tenantId: params.tenantId,
          facilityId: params.facilityId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          oldValue: params.oldValue ?? undefined,
          newValue: params.newValue ?? undefined,
          changedByUserId: params.changedByUserId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to write audit log: ${err}`);
      return null;
    }
  }

  async findAll(tenantId: string, filters?: {
    entityType?: string;
    entityId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: any[]; total: number }> {
    const where: any = { tenantId };
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.entityId) where.entityId = filters.entityId;
    if (filters?.action) where.action = filters.action;
    if (filters?.startDate || filters?.endDate) {
      where.occurredAt = {};
      if (filters.startDate) where.occurredAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.occurredAt.lte = new Date(filters.endDate);
    }

    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    const [items, total] = await Promise.all([
      this.prisma.systemAuditLog.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        take: Math.min(limit, 200),
        skip: offset,
      }),
      this.prisma.systemAuditLog.count({ where }),
    ]);

    return { items, total };
  }
}
