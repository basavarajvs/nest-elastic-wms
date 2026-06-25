import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListPerformanceDto } from './dtos/labor.dto';

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listMetrics(tenantId: string, filters: ListPerformanceDto): Promise<any> {
    const where: any = { tenantId, facilityId: filters.facilityId };
    if (filters.userId) where.userId = filters.userId;
    if (filters.metricDate) where.metricDate = new Date(filters.metricDate);
    return this.prisma.laborPerformanceMetric.findMany({
      where,
      orderBy: { metricDate: 'desc' },
    });
  }

  async getMyMetrics(userId: string, tenantId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const metric = await this.prisma.laborPerformanceMetric.findFirst({
      where: {
        tenantId,
        userId,
        metricDate: { gte: today, lt: tomorrow },
      },
    });

    const activeLog = await this.prisma.laborTimeLog.findFirst({
      where: { tenantId, userId, status: 'ACTIVE' },
    });

    return { metric, activeLog };
  }
}
