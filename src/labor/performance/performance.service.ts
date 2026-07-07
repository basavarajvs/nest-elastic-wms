import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async delete(tenantId: string, metricId: bigint) {
    const record = await this.prisma.labor_performance_metrics.findFirst({
      where: { tenant_id: tenantId, metric_id: metricId },
    });
    await this.prisma.labor_performance_metrics.deleteMany({
      where: { tenant_id: tenantId, metric_id: metricId },
    });
    return record;
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.userId) where.user_id = query.userId;
    if (query.taskType) where.task_type = query.taskType;
    if (query.dateFrom) where.date_calculated = { ...where.date_calculated, gte: new Date(query.dateFrom) };
    if (query.dateTo) where.date_calculated = { ...where.date_calculated, lte: new Date(query.dateTo) };

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [rawData, total] = await Promise.all([
      this.prisma.labor_performance_metrics.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date_calculated: 'desc' },
        include: { warehouse_facilities: { select: { facility_name: true } } },
      }),
      this.prisma.labor_performance_metrics.count({ where }),
    ]);
    const data = rawData.map(({ warehouse_facilities, ...rest }) => ({
      ...rest,
      facility_name: warehouse_facilities?.facility_name ?? null,
    }));
    return { data, total, page, limit };
  }
}
