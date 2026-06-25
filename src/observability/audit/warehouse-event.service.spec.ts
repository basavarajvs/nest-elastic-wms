import { Test, TestingModule } from '@nestjs/testing';
import { WarehouseEventService } from './warehouse-event.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('WarehouseEventService', () => {
  let service: WarehouseEventService;
  let prisma: any;
  let eventEmitter: any;

  const mockPrisma = {
    warehouseEvent: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarehouseEventService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<WarehouseEventService>(WarehouseEventService);
    prisma = mockPrisma;
    eventEmitter = mockEventEmitter;
  });

  afterEach(() => jest.clearAllMocks());

  describe('publish', () => {
    it('should create an event and emit it', async () => {
      const event = {
        id: 'evt-1',
        tenantId: 'tenant-1',
        eventType: 'WORK_ORDER_CREATED',
        entityType: 'WorkOrder',
        entityId: 'wo-1',
        source: 'WEB',
      };
      mockPrisma.warehouseEvent.create.mockResolvedValue(event);

      const result = await service.publish({
        tenantId: 'tenant-1',
        eventType: 'WORK_ORDER_CREATED',
        entityType: 'WorkOrder',
        entityId: 'wo-1',
        source: 'WEB',
        performedByUserId: 'user-1',
      });

      expect(mockPrisma.warehouseEvent.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          facilityId: undefined,
          eventType: 'WORK_ORDER_CREATED',
          entityType: 'WorkOrder',
          entityId: 'wo-1',
          eventData: undefined,
          source: 'WEB',
          performedByUserId: 'user-1',
        },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('warehouse.event', event);
      expect(eventEmitter.emit).toHaveBeenCalledWith('warehouse.event.WORK_ORDER_CREATED', event);
      expect(result).toEqual(event);
    });

    it('should default source to SYSTEM', async () => {
      mockPrisma.warehouseEvent.create.mockResolvedValue({ id: 'evt-2' });

      await service.publish({
        tenantId: 'tenant-1',
        eventType: 'INVENTORY_ADJUSTED',
        entityType: 'Inventory',
        entityId: 'inv-1',
      });

      expect(mockPrisma.warehouseEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          source: 'SYSTEM',
        }),
      });
    });
  });

  describe('findById', () => {
    it('should return event by id scoped to tenant', async () => {
      const event = { id: 'evt-1', tenantId: 'tenant-1' };
      mockPrisma.warehouseEvent.findFirst.mockResolvedValue(event);

      const result = await service.findById('evt-1', 'tenant-1');

      expect(mockPrisma.warehouseEvent.findFirst).toHaveBeenCalledWith({
        where: { id: 'evt-1', tenantId: 'tenant-1' },
      });
      expect(result).toEqual(event);
    });
  });

  describe('findAll', () => {
    it('should return paginated events with filters', async () => {
      const items = [{ id: 'evt-1' }];
      mockPrisma.warehouseEvent.findMany.mockResolvedValue(items);
      mockPrisma.warehouseEvent.count.mockResolvedValue(1);

      const result = await service.findAll('tenant-1', { eventType: 'WORK_ORDER_CREATED' });

      expect(mockPrisma.warehouseEvent.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', eventType: 'WORK_ORDER_CREATED' },
        orderBy: { occurredAt: 'desc' },
        take: 50,
        skip: 0,
      });
      expect(result).toEqual({ items, total: 1 });
    });

    it('should cap limit at 200', async () => {
      mockPrisma.warehouseEvent.findMany.mockResolvedValue([]);
      mockPrisma.warehouseEvent.count.mockResolvedValue(0);

      await service.findAll('tenant-1', { limit: 500 });

      expect(mockPrisma.warehouseEvent.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        orderBy: { occurredAt: 'desc' },
        take: 200,
        skip: 0,
      });
    });
  });
});
