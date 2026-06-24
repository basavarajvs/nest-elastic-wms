import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VasExecutionService } from './vas-execution.service';
import { VasCatalogService } from '../vas-catalog/vas-catalog.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockPrisma = {
  vasExecutionTask: {
    count: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  vasTaskEvent: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockCatalog = {
  findServicesByIds: jest.fn(),
  lookupRate: jest.fn(),
};

const mockEventEmitter = { emit: jest.fn() };

describe('VasExecutionService', () => {
  let service: VasExecutionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VasExecutionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: VasCatalogService, useValue: mockCatalog },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();
    service = module.get(VasExecutionService);
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    const baseDto = {
      facilityId: 'fac-1',
      taskType: 'KITTING',
      quantityRequired: 10,
    };

    it('should create task with rate lookup from catalog', async () => {
      mockPrisma.vasExecutionTask.count.mockResolvedValue(0);
      mockCatalog.findServicesByIds.mockResolvedValue([{ id: 'svc-1' }]);
      mockCatalog.lookupRate.mockResolvedValue({ ratePerUnit: 5.50 });
      mockPrisma.vasExecutionTask.create.mockResolvedValue({
        id: 'task-1',
        taskNumber: 'VAS-000001',
        serviceId: 'svc-1',
        ratePerUnit: 5.50,
        totalCharge: 55.0,
      });

      const result = await service.createTask({ ...baseDto, serviceId: 'svc-1', clientId: 'client-1' }, 't-1');

      expect(mockCatalog.findServicesByIds).toHaveBeenCalledWith(['svc-1'], 't-1');
      expect(mockCatalog.lookupRate).toHaveBeenCalledWith('svc-1', 'client-1', 't-1');
      expect(mockPrisma.vasExecutionTask.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            serviceId: 'svc-1',
            clientId: 'client-1',
            ratePerUnit: 5.50,
            totalCharge: 55.0,
          }),
        }),
      );
      expect(result.ratePerUnit).toBe(5.50);
    });

    it('should throw when service not in catalog', async () => {
      mockPrisma.vasExecutionTask.count.mockResolvedValue(0);
      mockCatalog.findServicesByIds.mockResolvedValue([]);

      await expect(service.createTask({ ...baseDto, serviceId: 'bad-svc' }, 't-1')).rejects.toThrow(BadRequestException);
    });

    it('should use explicit ratePerUnit when no serviceId provided', async () => {
      mockPrisma.vasExecutionTask.count.mockResolvedValue(0);
      mockPrisma.vasExecutionTask.create.mockResolvedValue({
        id: 'task-1',
        taskNumber: 'VAS-000001',
        ratePerUnit: 10.0,
      });

      const result = await service.createTask({ ...baseDto, ratePerUnit: 10.0 }, 't-1');

      expect(mockPrisma.vasExecutionTask.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ratePerUnit: 10.0 }),
        }),
      );
      expect(result.ratePerUnit).toBe(10.0);
    });

    it('should use explicit ratePerUnit when catalog returns no rate', async () => {
      mockPrisma.vasExecutionTask.count.mockResolvedValue(0);
      mockCatalog.findServicesByIds.mockResolvedValue([{ id: 'svc-1' }]);
      mockCatalog.lookupRate.mockResolvedValue({ ratePerUnit: null });
      mockPrisma.vasExecutionTask.create.mockResolvedValue({
        id: 'task-1',
        ratePerUnit: 7.0,
      });

      const result = await service.createTask({ ...baseDto, serviceId: 'svc-1', ratePerUnit: 7.0 }, 't-1');

      expect(result.ratePerUnit).toBe(7.0);
    });
  });

  describe('updateTask', () => {
    it('should recalculate totalCharge when quantityCompleted is set', async () => {
      mockPrisma.vasExecutionTask.findFirst.mockResolvedValue({
        id: 'task-1',
        tenantId: 't-1',
        ratePerUnit: 5.50,
      });
      mockPrisma.vasExecutionTask.update.mockResolvedValue({
        id: 'task-1',
        quantityCompleted: 8,
        totalCharge: 44.0,
      });

      const result = await service.updateTask('task-1', { quantityCompleted: 8 }, 't-1');

      expect(mockPrisma.vasExecutionTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'task-1' },
          data: expect.objectContaining({
            quantityCompleted: 8,
            totalCharge: 44.0,
          }),
        }),
      );
      expect(result.totalCharge).toBe(44.0);
    });

    it('should not fail when ratePerUnit is null on completion', async () => {
      mockPrisma.vasExecutionTask.findFirst.mockResolvedValue({
        id: 'task-1',
        tenantId: 't-1',
        ratePerUnit: null,
      });
      mockPrisma.vasExecutionTask.update.mockResolvedValue({ id: 'task-1', quantityCompleted: 5 });

      const result = await service.updateTask('task-1', { quantityCompleted: 5 }, 't-1');

      expect(mockPrisma.vasExecutionTask.update).toHaveBeenCalled();
      expect(result.quantityCompleted).toBe(5);
    });

    it('should set timestamps on status changes', async () => {
      mockPrisma.vasExecutionTask.findFirst.mockResolvedValue({ id: 'task-1', tenantId: 't-1' });
      mockPrisma.vasExecutionTask.update.mockResolvedValue({ id: 'task-1', status: 'COMPLETED' });

      await service.updateTask('task-1', { status: 'COMPLETED' }, 't-1');

      expect(mockPrisma.vasExecutionTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'COMPLETED',
            completedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should filter by status and facility', async () => {
      mockPrisma.vasExecutionTask.findMany.mockResolvedValue([{ id: 't-1' }]);

      const result = await service.findAll('t-1', { status: 'PENDING', facilityId: 'fac-1' });

      expect(mockPrisma.vasExecutionTask.findMany).toHaveBeenCalledWith({
        where: { tenantId: 't-1', status: 'PENDING', facilityId: 'fac-1' },
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should throw when not found', async () => {
      mockPrisma.vasExecutionTask.findFirst.mockResolvedValue(null);
      await expect(service.findById('bad-id', 't-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addEvent / getEvents', () => {
    it('should create and retrieve task events', async () => {
      mockPrisma.vasExecutionTask.findFirst.mockResolvedValue({ id: 'task-1' });
      mockPrisma.vasTaskEvent.create.mockResolvedValue({ id: 'evt-1', eventType: 'STARTED' });
      mockPrisma.vasTaskEvent.findMany.mockResolvedValue([{ id: 'evt-1' }]);

      await service.addEvent('task-1', 'STARTED', '{}', 'u-1', 't-1');
      const events = await service.getEvents('task-1', 't-1');

      expect(mockPrisma.vasTaskEvent.create).toHaveBeenCalled();
      expect(events).toHaveLength(1);
    });
  });
});
