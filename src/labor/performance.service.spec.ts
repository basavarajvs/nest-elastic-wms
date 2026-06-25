import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceService } from './performance.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  laborPerformanceMetric: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  laborTimeLog: {
    findFirst: jest.fn(),
  },
};

describe('PerformanceService', () => {
  let service: PerformanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PerformanceService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(PerformanceService);
    jest.clearAllMocks();
  });

  it('should list metrics filtered by facility and date', async () => {
    mockPrisma.laborPerformanceMetric.findMany.mockResolvedValue([{ id: 'm-1', score: 85 }]);
    const result = await service.listMetrics('t-1', { facilityId: 'fac-1', metricDate: '2026-06-25' });
    expect(mockPrisma.laborPerformanceMetric.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ facilityId: 'fac-1' }) }),
    );
    expect(result).toHaveLength(1);
  });

  it('should getMyMetrics with today\'s data', async () => {
    mockPrisma.laborPerformanceMetric.findFirst.mockResolvedValue({ id: 'm-1', score: 90 });
    mockPrisma.laborTimeLog.findFirst.mockResolvedValue({ id: 'log-1', status: 'ACTIVE' });
    const result = await service.getMyMetrics('u-1', 't-1');
    expect(result.metric.score).toBe(90);
    expect(result.activeLog.id).toBe('log-1');
  });

  it('should return null metric when none exist', async () => {
    mockPrisma.laborPerformanceMetric.findFirst.mockResolvedValue(null);
    mockPrisma.laborTimeLog.findFirst.mockResolvedValue(null);
    const result = await service.getMyMetrics('u-1', 't-1');
    expect(result.metric).toBeNull();
    expect(result.activeLog).toBeNull();
  });
});
