import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KpiService {
  private readonly logger = new Logger(KpiService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDailyKpis(tenantId: string, filters?: {
    facilityId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: any[]; total: number }> {
    const where: any = { tenantId };
    if (filters?.facilityId) where.facilityId = filters.facilityId;
    if (filters?.startDate || filters?.endDate) {
      where.metricDate = {};
      if (filters.startDate) where.metricDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.metricDate.lte = new Date(filters.endDate);
    }

    const limit = filters?.limit ?? 31;
    const offset = filters?.offset ?? 0;

    const [items, total] = await Promise.all([
      this.prisma.dailyKpiMetric.findMany({
        where,
        orderBy: { metricDate: 'desc' },
        take: Math.min(limit, 365),
        skip: offset,
      }),
      this.prisma.dailyKpiMetric.count({ where }),
    ]);

    return { items, total };
  }

  async getSummary(tenantId: string, filters?: {
    facilityId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const where: any = { tenantId };
    if (filters?.facilityId) where.facilityId = filters.facilityId;
    if (filters?.startDate || filters?.endDate) {
      where.metricDate = {};
      if (filters.startDate) where.metricDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.metricDate.lte = new Date(filters.endDate);
    }

    const result = await this.prisma.dailyKpiMetric.aggregate({
      where,
      _sum: {
        ordersCreated: true,
        ordersShipped: true,
        linesShipped: true,
        unitsShipped: true,
        receiptsCreated: true,
        receiptsCompleted: true,
        putawaysCompleted: true,
        picksCompleted: true,
        packsCompleted: true,
        shipmentsCreated: true,
        shipmentsLoaded: true,
        cycleCountsCompleted: true,
        adjustmentsCreated: true,
        exceptionsCreated: true,
        exceptionsResolved: true,
        activeUsers: true,
        totalErrors: true,
      },
      _avg: {
        onHandValue: true,
      },
      _count: {
        id: true,
      },
    });

    const days = result._count.id;
    const sum = result._sum as any;
    const avg = result._avg as any;

    return {
      totalDays: days,
      totals: {
        ordersCreated: sum.ordersCreated ?? 0,
        ordersShipped: sum.ordersShipped ?? 0,
        linesShipped: sum.linesShipped ?? 0,
        unitsShipped: sum.unitsShipped ?? 0,
        receiptsCreated: sum.receiptsCreated ?? 0,
        receiptsCompleted: sum.receiptsCompleted ?? 0,
        putawaysCompleted: sum.putawaysCompleted ?? 0,
        picksCompleted: sum.picksCompleted ?? 0,
        packsCompleted: sum.packsCompleted ?? 0,
        shipmentsCreated: sum.shipmentsCreated ?? 0,
        shipmentsLoaded: sum.shipmentsLoaded ?? 0,
        cycleCountsCompleted: sum.cycleCountsCompleted ?? 0,
        adjustmentsCreated: sum.adjustmentsCreated ?? 0,
        exceptionsCreated: sum.exceptionsCreated ?? 0,
        exceptionsResolved: sum.exceptionsResolved ?? 0,
        activeUsers: sum.activeUsers ?? 0,
        totalErrors: sum.totalErrors ?? 0,
      },
      averages: {
        onHandValue: avg.onHandValue !== null ? Number(avg.onHandValue.toFixed(2)) : null,
        ordersPerDay: days > 0 ? Math.round((sum.ordersCreated ?? 0) / days) : 0,
        linesPerDay: days > 0 ? Math.round((sum.linesShipped ?? 0) / days) : 0,
        picksPerDay: days > 0 ? Math.round((sum.picksCompleted ?? 0) / days) : 0,
        packsPerDay: days > 0 ? Math.round((sum.packsCompleted ?? 0) / days) : 0,
        shipmentsPerDay: days > 0 ? Math.round((sum.shipmentsCreated ?? 0) / days) : 0,
      },
    };
  }
}
