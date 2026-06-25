import { Test, TestingModule } from '@nestjs/testing';
import { HeatmapService } from './heatmap.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HeatmapService', () => {
  let service: HeatmapService;
  let prisma: any;

  const mockPrisma = {
    locationPickHeatmap: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HeatmapService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<HeatmapService>(HeatmapService);
    prisma = mockPrisma;
  });

  afterEach(() => jest.clearAllMocks());

  describe('getPickHeatmap', () => {
    it('should return paginated heatmap data', async () => {
      const items = [{ id: 'hm-1', locationId: 'loc-1', pickCount: 50, pickFrequency: 'HIGH' }];
      mockPrisma.locationPickHeatmap.findMany.mockResolvedValue(items);
      mockPrisma.locationPickHeatmap.count.mockResolvedValue(1);

      const result = await service.getPickHeatmap('tenant-1', { facilityId: 'fac-1' });

      expect(mockPrisma.locationPickHeatmap.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', facilityId: 'fac-1' },
        orderBy: [{ metricDate: 'desc' }, { pickCount: 'desc' }],
        take: 50,
        skip: 0,
      });
      expect(result).toEqual({ items, total: 1 });
    });

    it('should include location relation when zoneId filter provided', async () => {
      mockPrisma.locationPickHeatmap.findMany.mockResolvedValue([]);
      mockPrisma.locationPickHeatmap.count.mockResolvedValue(0);

      await service.getPickHeatmap('tenant-1', { zoneId: 'zone-1' });

      expect(mockPrisma.locationPickHeatmap.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        orderBy: [{ metricDate: 'desc' }, { pickCount: 'desc' }],
        take: 50,
        skip: 0,
        include: { location: true },
      });
    });

    it('should cap limit at 200', async () => {
      mockPrisma.locationPickHeatmap.findMany.mockResolvedValue([]);
      mockPrisma.locationPickHeatmap.count.mockResolvedValue(0);

      await service.getPickHeatmap('tenant-1', { limit: 500 });

      expect(mockPrisma.locationPickHeatmap.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        orderBy: [{ metricDate: 'desc' }, { pickCount: 'desc' }],
        take: 200,
        skip: 0,
      });
    });

    it('should apply date range filters', async () => {
      mockPrisma.locationPickHeatmap.findMany.mockResolvedValue([]);
      mockPrisma.locationPickHeatmap.count.mockResolvedValue(0);

      await service.getPickHeatmap('tenant-1', { startDate: '2026-01-01', endDate: '2026-06-30' });

      expect(mockPrisma.locationPickHeatmap.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          metricDate: { gte: new Date('2026-01-01'), lte: new Date('2026-06-30') },
        },
        orderBy: [{ metricDate: 'desc' }, { pickCount: 'desc' }],
        take: 50,
        skip: 0,
      });
    });
  });

  describe('getTopLocations', () => {
    it('should return top N locations by pick count', async () => {
      const items = [
        { id: 'hm-1', locationId: 'loc-1', pickCount: 100 },
        { id: 'hm-2', locationId: 'loc-2', pickCount: 80 },
      ];
      mockPrisma.locationPickHeatmap.findMany.mockResolvedValue(items);

      const result = await service.getTopLocations('tenant-1', { topN: 10 });

      expect(mockPrisma.locationPickHeatmap.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        orderBy: { pickCount: 'desc' },
        take: 10,
      });
      expect(result).toEqual(items);
    });

    it('should default to top 20', async () => {
      mockPrisma.locationPickHeatmap.findMany.mockResolvedValue([]);

      await service.getTopLocations('tenant-1', {});

      expect(mockPrisma.locationPickHeatmap.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        orderBy: { pickCount: 'desc' },
        take: 20,
      });
    });

    it('should cap at 100', async () => {
      mockPrisma.locationPickHeatmap.findMany.mockResolvedValue([]);

      await service.getTopLocations('tenant-1', { topN: 999 });

      expect(mockPrisma.locationPickHeatmap.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        orderBy: { pickCount: 'desc' },
        take: 100,
      });
    });
  });
});
