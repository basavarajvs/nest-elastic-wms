import { Test, TestingModule } from '@nestjs/testing';
import { KpiService } from './kpi.service';
import { PrismaService } from '../prisma/prisma.service';

describe('KpiService', () => {
  let service: KpiService;
  let prisma: any;

  const mockPrisma = {
    dailyKpiMetric: {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KpiService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<KpiService>(KpiService);
    prisma = mockPrisma;
  });

  afterEach(() => jest.clearAllMocks());

  describe('getDailyKpis', () => {
    it('should return paginated daily KPI metrics', async () => {
      const items = [{ id: 'kpi-1', metricDate: new Date('2026-06-25'), ordersCreated: 10 }];
      mockPrisma.dailyKpiMetric.findMany.mockResolvedValue(items);
      mockPrisma.dailyKpiMetric.count.mockResolvedValue(1);

      const result = await service.getDailyKpis('tenant-1', { facilityId: 'fac-1' });

      expect(mockPrisma.dailyKpiMetric.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', facilityId: 'fac-1' },
        orderBy: { metricDate: 'desc' },
        take: 31,
        skip: 0,
      });
      expect(result).toEqual({ items, total: 1 });
    });

    it('should apply date range filters', async () => {
      mockPrisma.dailyKpiMetric.findMany.mockResolvedValue([]);
      mockPrisma.dailyKpiMetric.count.mockResolvedValue(0);

      await service.getDailyKpis('tenant-1', {
        startDate: '2026-01-01',
        endDate: '2026-06-30',
      });

      expect(mockPrisma.dailyKpiMetric.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          metricDate: {
            gte: new Date('2026-01-01'),
            lte: new Date('2026-06-30'),
          },
        },
        orderBy: { metricDate: 'desc' },
        take: 31,
        skip: 0,
      });
    });

    it('should cap limit at 365', async () => {
      mockPrisma.dailyKpiMetric.findMany.mockResolvedValue([]);
      mockPrisma.dailyKpiMetric.count.mockResolvedValue(0);

      await service.getDailyKpis('tenant-1', { limit: 500 });

      expect(mockPrisma.dailyKpiMetric.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        orderBy: { metricDate: 'desc' },
        take: 365,
        skip: 0,
      });
    });
  });

  describe('getSummary', () => {
    it('should return aggregate summary with totals and averages', async () => {
      const aggregateResult = {
        _sum: {
          ordersCreated: 100,
          ordersShipped: 80,
          linesShipped: 500,
          unitsShipped: 1200,
          receiptsCreated: 30,
          receiptsCompleted: 28,
          putawaysCompleted: 25,
          picksCompleted: 450,
          packsCompleted: 80,
          shipmentsCreated: 75,
          shipmentsLoaded: 70,
          cycleCountsCompleted: 10,
          adjustmentsCreated: 5,
          exceptionsCreated: 12,
          exceptionsResolved: 10,
          activeUsers: 15,
          totalErrors: 3,
        },
        _avg: { onHandValue: 150000.5 },
        _count: { id: 5 },
      };
      mockPrisma.dailyKpiMetric.aggregate.mockResolvedValue(aggregateResult);

      const result = await service.getSummary('tenant-1');

      expect(result.totalDays).toBe(5);
      expect(result.totals.ordersCreated).toBe(100);
      expect(result.totals.ordersShipped).toBe(80);
      expect(result.averages.onHandValue).toBe(150000.50);
      expect(result.averages.ordersPerDay).toBe(20);
      expect(result.averages.linesPerDay).toBe(100);
      expect(result.averages.picksPerDay).toBe(90);
    });

    it('should handle empty data', async () => {
      const emptyResult = {
        _sum: {},
        _avg: { onHandValue: null },
        _count: { id: 0 },
      };
      mockPrisma.dailyKpiMetric.aggregate.mockResolvedValue(emptyResult);

      const result = await service.getSummary('tenant-1');

      expect(result.totalDays).toBe(0);
      expect(result.totals.ordersCreated).toBe(0);
      expect(result.averages.onHandValue).toBeNull();
      expect(result.averages.ordersPerDay).toBe(0);
    });
  });
});
