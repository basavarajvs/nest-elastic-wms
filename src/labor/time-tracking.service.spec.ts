import { Test, TestingModule } from '@nestjs/testing';
import { TimeTrackingService } from './time-tracking.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

const mockPrisma = {
  laborTimeLog: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('TimeTrackingService', () => {
  let service: TimeTrackingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimeTrackingService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(TimeTrackingService);
    jest.clearAllMocks();
  });

  describe('clockIn', () => {
    it('should create a time log', async () => {
      mockPrisma.laborTimeLog.findFirst.mockResolvedValue(null);
      mockPrisma.laborTimeLog.create.mockResolvedValue({ id: 'log-1', clockIn: expect.any(Date) });
      const result = await service.clockIn({ facilityId: 'fac-1' }, 'u-1', 't-1');
      expect(result.id).toBe('log-1');
    });

    it('should throw when already active', async () => {
      mockPrisma.laborTimeLog.findFirst.mockResolvedValue({ id: 'log-1', status: 'ACTIVE' });
      await expect(service.clockIn({ facilityId: 'fac-1' }, 'u-1', 't-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('clockOut', () => {
    it('should complete log with calculated minutes', async () => {
      const past = new Date();
      past.setHours(past.getHours() - 9);
      mockPrisma.laborTimeLog.findFirst.mockResolvedValue({ id: 'log-1', clockIn: past, status: 'ACTIVE' });
      mockPrisma.laborTimeLog.update.mockResolvedValue({ id: 'log-1', totalMinutes: 540, overtimeMinutes: 60, status: 'COMPLETED' });
      const result = await service.clockOut({ timeLogId: 'log-1', breakDuration: 0 }, 'u-1', 't-1');
      expect(mockPrisma.laborTimeLog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'COMPLETED', overtimeMinutes: expect.any(Number) }),
        }),
      );
      expect(result.status).toBe('COMPLETED');
    });

    it('should throw when no active log', async () => {
      mockPrisma.laborTimeLog.findFirst.mockResolvedValue(null);
      await expect(service.clockOut({ timeLogId: 'bad' }, 'u-1', 't-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('listTimeLogs', () => {
    it('should filter by userId and date', async () => {
      mockPrisma.laborTimeLog.findMany.mockResolvedValue([{ id: 'log-1' }]);
      const result = await service.listTimeLogs('t-1', { facilityId: 'fac-1', userId: 'u-1', date: '2026-06-25' });
      expect(mockPrisma.laborTimeLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: 'u-1' }) }),
      );
      expect(result).toHaveLength(1);
    });
  });
});
