import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HeatmapService {
  private readonly logger = new Logger(HeatmapService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPickHeatmap(tenantId: string, filters?: {
    facilityId?: string;
    zoneId?: string;
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

    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    const queryOptions: any = {
      where,
      orderBy: [{ metricDate: 'desc' }, { pickCount: 'desc' }],
      take: Math.min(limit, 200),
      skip: offset,
    };

    if (filters?.zoneId) {
      queryOptions.include = { location: true };
    }

    const [items, total] = await Promise.all([
      this.prisma.locationPickHeatmap.findMany(queryOptions),
      this.prisma.locationPickHeatmap.count({ where }),
    ]);

    return { items, total };
  }

  async getTopLocations(tenantId: string, filters?: {
    facilityId?: string;
    zoneId?: string;
    startDate?: string;
    endDate?: string;
    topN?: number;
  }): Promise<any[]> {
    const where: any = { tenantId };
    if (filters?.facilityId) where.facilityId = filters.facilityId;
    if (filters?.startDate || filters?.endDate) {
      where.metricDate = {};
      if (filters.startDate) where.metricDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.metricDate.lte = new Date(filters.endDate);
    }

    const topN = filters?.topN ?? 20;

    const items = await this.prisma.locationPickHeatmap.findMany({
      where,
      orderBy: { pickCount: 'desc' },
      take: Math.min(topN, 100),
    });

    return items;
  }
}
