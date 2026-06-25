import { Test, TestingModule } from '@nestjs/testing';
import { FulfillmentBillingService } from './fulfillment-billing.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('FulfillmentBillingService', () => {
  let service: FulfillmentBillingService;
  let prisma: any;
  let eventEmitter: any;

  const mockPrisma = {
    fulfillmentBillingRun: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    fulfillmentBillingEvent: {},
  };

  const mockEventEmitter = { emit: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FulfillmentBillingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<FulfillmentBillingService>(FulfillmentBillingService);
    prisma = mockPrisma;
    eventEmitter = mockEventEmitter;
  });

  afterEach(() => jest.clearAllMocks());

  describe('createRun', () => {
    it('should create a billing run with auto-numbering', async () => {
      mockPrisma.fulfillmentBillingRun.count.mockResolvedValue(0);
      const run = { id: 'run-1', runNumber: 'BR-000001', status: 'PENDING' };
      mockPrisma.fulfillmentBillingRun.create.mockResolvedValue(run);

      const result = await service.createRun({
        tenantId: 'tenant-1',
        facilityId: 'fac-1',
        runType: 'ORDER_FULFILLMENT',
        periodStart: '2026-06-01',
        periodEnd: '2026-06-30',
      });

      expect(mockPrisma.fulfillmentBillingRun.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          facilityId: 'fac-1',
          runNumber: 'BR-000001',
          runType: 'ORDER_FULFILLMENT',
          periodStart: new Date('2026-06-01'),
          periodEnd: new Date('2026-06-30'),
          totalTransactions: 0,
          totalAmount: 0,
          status: 'PENDING',
        },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('fulfillment.billing.run.created', run);
      expect(result.runNumber).toBe('BR-000001');
    });

    it('should increment run number', async () => {
      mockPrisma.fulfillmentBillingRun.count.mockResolvedValue(5);
      mockPrisma.fulfillmentBillingRun.create.mockResolvedValue({ id: 'run-2', runNumber: 'BR-000006' });

      const result = await service.createRun({
        tenantId: 'tenant-1',
        facilityId: 'fac-1',
        runType: 'STORAGE',
        periodStart: '2026-06-01',
        periodEnd: '2026-06-30',
      });

      expect(result.runNumber).toBe('BR-000006');
    });
  });

  describe('findAll', () => {
    it('should return paginated billing runs', async () => {
      const items = [{ id: 'run-1' }];
      mockPrisma.fulfillmentBillingRun.findMany.mockResolvedValue(items);
      mockPrisma.fulfillmentBillingRun.count.mockResolvedValue(1);

      const result = await service.findAll('tenant-1', { status: 'PENDING' });

      expect(mockPrisma.fulfillmentBillingRun.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: 0,
      });
      expect(result).toEqual({ items, total: 1 });
    });
  });

  describe('findById', () => {
    it('should return run with events', async () => {
      const run = { id: 'run-1', tenantId: 'tenant-1', events: [{ id: 'evt-1' }] };
      mockPrisma.fulfillmentBillingRun.findFirst.mockResolvedValue(run);

      const result = await service.findById('run-1', 'tenant-1');

      expect(mockPrisma.fulfillmentBillingRun.findFirst).toHaveBeenCalledWith({
        where: { id: 'run-1', tenantId: 'tenant-1' },
        include: { events: { orderBy: { eventDate: 'asc' } } },
      });
      expect(result).toEqual(run);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.fulfillmentBillingRun.findFirst.mockResolvedValue(null);

      await expect(service.findById('bad-id', 'tenant-1')).rejects.toThrow('Billing run not found');
    });
  });

  describe('executeRun', () => {
    it('should set status to EXECUTING', async () => {
      mockPrisma.fulfillmentBillingRun.findFirst.mockResolvedValue({ id: 'run-1', status: 'PENDING' });
      const updated = { id: 'run-1', status: 'EXECUTING' };
      mockPrisma.fulfillmentBillingRun.update.mockResolvedValue(updated);

      const result = await service.executeRun('run-1', 'tenant-1');

      expect(mockPrisma.fulfillmentBillingRun.update).toHaveBeenCalledWith({
        where: { id: 'run-1' },
        data: { status: 'EXECUTING', executedAt: expect.any(Date) },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('fulfillment.billing.run.executed', updated);
      expect(result).toEqual(updated);
    });

    it('should throw if run not PENDING', async () => {
      mockPrisma.fulfillmentBillingRun.findFirst.mockResolvedValue({ id: 'run-1', status: 'COMPLETED' });
      await expect(service.executeRun('run-1', 'tenant-1')).rejects.toThrow('Cannot execute run in status COMPLETED');
    });
  });
});
