import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CountMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async computeMetrics(countId: string, tenantId: string) {
    const count = await (this.prisma as any).cycleCount.findFirst({
      where: { id: countId, tenantId },
      include: { lines: true },
    });
    if (!count) throw new NotFoundException('Cycle count not found');

    const lines = count.lines;
    const totalLines = lines.length;
    const countedLines = lines.filter((l: any) => l.countedQuantity !== null && l.countedQuantity !== undefined).length;

    let zeroVarianceLines = 0;
    let positiveVarianceLines = 0;
    let negativeVarianceLines = 0;
    let totalVariance = 0;

    for (const line of lines) {
      if (line.countedQuantity === null || line.countedQuantity === undefined) continue;
      const variance = line.countedQuantity - (line.systemQuantity || 0);
      if (variance === 0) zeroVarianceLines++;
      else if (variance > 0) positiveVarianceLines++;
      else negativeVarianceLines++;
      totalVariance += Math.abs(variance);
    }

    const accuracyRate = countedLines > 0 ? zeroVarianceLines / countedLines : 0;
    const startAt = count.startedAt || count.createdAt;
    const endAt = new Date();
    const durationMinutes = Math.round((endAt.getTime() - startAt.getTime()) / 60000);

    const data = {
      tenantId,
      facilityId: count.facilityId,
      countId,
      totalLines,
      countedLines,
      zeroVarianceLines,
      positiveVarianceLines,
      negativeVarianceLines,
      totalVariance,
      accuracyRate,
      durationMinutes,
    };

    return (this.prisma as any).cycleCountMetrics.upsert({
      where: { tenantId_countId: { tenantId, countId } },
      create: data,
      update: data,
    });
  }

  async getMetrics(countId: string, tenantId: string) {
    const metrics = await (this.prisma as any).cycleCountMetrics.findFirst({
      where: { countId, tenantId },
    });
    if (!metrics) throw new NotFoundException('Metrics not found for this count');
    return metrics;
  }

  async getAggregateMetrics(tenantId: string, facilityId?: string) {
    const where: any = { tenantId };
    if (facilityId) where.facilityId = facilityId;

    const all = await (this.prisma as any).cycleCountMetrics.findMany({ where });
    if (all.length === 0) return { totalCounts: 0 };

    const avgAccuracy = all.reduce((s: number, m: any) => s + (m.accuracyRate || 0), 0) / all.length;
    const totalLines = all.reduce((s: number, m: any) => s + m.totalLines, 0);
    const totalVariance = all.reduce((s: number, m: any) => s + m.totalVariance, 0);

    return {
      totalCounts: all.length,
      avgAccuracyRate: Math.round(avgAccuracy * 10000) / 10000,
      totalLines,
      totalVariance: Math.round(totalVariance * 100) / 100,
      avgDurationMinutes: all.length > 0
        ? Math.round(all.reduce((s: number, m: any) => s + (m.durationMinutes || 0), 0) / all.length)
        : 0,
    };
  }

  async getAccuracyRecords(tenantId: string, filters?: { productId?: string; facilityId?: string; fromDate?: string; toDate?: string }) {
    const where: any = { tenantId };
    if (filters?.productId) where.productId = filters.productId;
    if (filters?.facilityId) where.facilityId = filters.facilityId;
    if (filters?.fromDate || filters?.toDate) {
      where.recordedAt = {};
      if (filters.fromDate) where.recordedAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.recordedAt.lte = new Date(filters.toDate);
    }
    return (this.prisma as any).countAccuracyHistory.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: 500,
    });
  }
}
