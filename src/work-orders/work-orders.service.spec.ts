import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WorkOrdersService } from './work-orders.service';
import { OperationsService } from './operations.service';
import { ComponentsService } from './components.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockPrisma = {
  workOrder: {
    count: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  workOrderOperation: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  workOrderComponent: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

const mockEventEmitter = { emit: jest.fn() };

describe('WorkOrdersService', () => {
  let service: WorkOrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkOrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();
    service = module.get(WorkOrdersService);
    jest.clearAllMocks();
  });

  const baseDto = {
    facilityId: 'fac-1',
    workOrderType: 'ASSEMBLY',
    productId: 'prod-1',
    quantity: 10,
    uomId: 'uom-1',
  };

  const tenantId = 'tenant-1';

  describe('create', () => {
    it('should create a work order with auto-generated number', async () => {
      mockPrisma.workOrder.count.mockResolvedValue(0);
      mockPrisma.workOrder.create.mockResolvedValue({ id: 'wo-1', workOrderNumber: 'WO-000001', ...baseDto, tenantId, status: 'DRAFT', priority: 'MEDIUM' });

      const result = await service.create(baseDto, tenantId, 'user-1');

      expect(mockPrisma.workOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId,
            facilityId: 'fac-1',
            workOrderNumber: 'WO-000001',
            workOrderType: 'ASSEMBLY',
            requestedByUserId: 'user-1',
          }),
        }),
      );
      expect(result.workOrderNumber).toBe('WO-000001');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('work-order.created', expect.any(Object));
    });

    it('should increment work order number', async () => {
      mockPrisma.workOrder.count.mockResolvedValue(5);
      mockPrisma.workOrder.create.mockResolvedValue({ id: 'wo-2', workOrderNumber: 'WO-000006' });

      const result = await service.create(baseDto, tenantId, 'user-1');

      expect(result.workOrderNumber).toBe('WO-000006');
    });
  });

  describe('findAll', () => {
    it('should return work orders with filters', async () => {
      const mockOrders = [{ id: 'wo-1', operations: [], components: [] }];
      mockPrisma.workOrder.findMany.mockResolvedValue(mockOrders);

      const result = await service.findAll(tenantId, { status: 'DRAFT' });

      expect(mockPrisma.workOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId, status: 'DRAFT' }),
        }),
      );
      expect(result).toEqual(mockOrders);
    });

    it('should return all orders when no filters', async () => {
      const mockOrders = [{ id: 'wo-1', operations: [], components: [] }];
      mockPrisma.workOrder.findMany.mockResolvedValue(mockOrders);

      const result = await service.findAll(tenantId);

      expect(mockPrisma.workOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId },
        }),
      );
      expect(result).toEqual(mockOrders);
    });
  });

  describe('findById', () => {
    it('should return work order with operations and components', async () => {
      const mockOrder = { id: 'wo-1', operations: [{ id: 'op-1' }], components: [{ id: 'comp-1' }] };
      mockPrisma.workOrder.findFirst.mockResolvedValue(mockOrder);

      const result = await service.findById('wo-1', tenantId);

      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.workOrder.findFirst.mockResolvedValue(null);
      await expect(service.findById('wo-1', tenantId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update work order fields', async () => {
      mockPrisma.workOrder.findFirst.mockResolvedValue({ id: 'wo-1', tenantId });
      mockPrisma.workOrder.update.mockResolvedValue({ id: 'wo-1', notes: 'updated' });

      const result = await service.update('wo-1', { notes: 'updated' }, tenantId);

      expect(mockPrisma.workOrder.update).toHaveBeenCalled();
      expect(result.notes).toBe('updated');
    });
  });

  describe('release', () => {
    it('should release a DRAFT work order', async () => {
      mockPrisma.workOrder.findFirst.mockResolvedValue({ id: 'wo-1', tenantId, status: 'DRAFT', workOrderNumber: 'WO-000001' });
      mockPrisma.workOrder.update.mockResolvedValue({ id: 'wo-1', status: 'RELEASED' });

      const result = await service.release('wo-1', tenantId);

      expect(result.status).toBe('RELEASED');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('work-order.released', expect.any(Object));
    });

    it('should throw BadRequestException if not DRAFT', async () => {
      mockPrisma.workOrder.findFirst.mockResolvedValue({ id: 'wo-1', tenantId, status: 'RELEASED' });
      await expect(service.release('wo-1', tenantId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('complete', () => {
    it('should complete a work order', async () => {
      mockPrisma.workOrder.findFirst.mockResolvedValue({ id: 'wo-1', tenantId, status: 'IN_PROGRESS', workOrderNumber: 'WO-000001' });
      mockPrisma.workOrder.update.mockResolvedValue({ id: 'wo-1', status: 'COMPLETED', completedAt: new Date() });

      const result = await service.complete('wo-1', tenantId);

      expect(result.status).toBe('COMPLETED');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('work-order.completed', expect.any(Object));
    });
  });

  describe('cancel', () => {
    it('should cancel a work order', async () => {
      mockPrisma.workOrder.findFirst.mockResolvedValue({ id: 'wo-1', tenantId, status: 'DRAFT', workOrderNumber: 'WO-000001' });
      mockPrisma.workOrder.update.mockResolvedValue({ id: 'wo-1', status: 'CANCELLED' });

      const result = await service.cancel('wo-1', tenantId);

      expect(result.status).toBe('CANCELLED');
    });

    it('should throw on already cancelled', async () => {
      mockPrisma.workOrder.findFirst.mockResolvedValue({ id: 'wo-1', tenantId, status: 'CANCELLED' });
      await expect(service.cancel('wo-1', tenantId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByAssignedUser', () => {
    it('should return assigned work orders', async () => {
      const mockOrders = [{ id: 'wo-1', operations: [], components: [] }];
      mockPrisma.workOrder.findMany.mockResolvedValue(mockOrders);

      const result = await service.findByAssignedUser(tenantId, 'user-1');

      expect(mockPrisma.workOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            assignedToUserId: 'user-1',
            status: { in: ['RELEASED', 'IN_PROGRESS'] },
          }),
        }),
      );
      expect(result).toEqual(mockOrders);
    });
  });
});

describe('OperationsService', () => {
  let service: OperationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();
    service = module.get(OperationsService);
    jest.clearAllMocks();
  });

  const tenantId = 'tenant-1';

  describe('addOperation', () => {
    it('should add operation to DRAFT work order', async () => {
      mockPrisma.workOrder.findFirst.mockResolvedValue({ id: 'wo-1', tenantId, status: 'DRAFT' });
      mockPrisma.workOrderOperation.create.mockResolvedValue({ id: 'op-1', workOrderId: 'wo-1', operationName: 'Test Op' });

      const result = await service.addOperation('wo-1', {
        sequenceNumber: 1,
        operationName: 'Test Op',
        operationType: 'TASK',
      }, tenantId);

      expect(result.operationName).toBe('Test Op');
    });

    it('should throw if work order not found', async () => {
      mockPrisma.workOrder.findFirst.mockResolvedValue(null);
      await expect(service.addOperation('wo-1', {
        sequenceNumber: 1,
        operationName: 'Test',
        operationType: 'TASK',
      }, tenantId)).rejects.toThrow(NotFoundException);
    });

    it('should throw if not DRAFT', async () => {
      mockPrisma.workOrder.findFirst.mockResolvedValue({ id: 'wo-1', tenantId, status: 'RELEASED' });
      await expect(service.addOperation('wo-1', {
        sequenceNumber: 1,
        operationName: 'Test',
        operationType: 'TASK',
      }, tenantId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateOperation', () => {
    it('should update operation status', async () => {
      mockPrisma.workOrderOperation.findFirst.mockResolvedValue({ id: 'op-1', workOrderId: 'wo-1', tenantId });
      mockPrisma.workOrderOperation.update.mockResolvedValue({ id: 'op-1', status: 'IN_PROGRESS', startedAt: new Date() });

      const result = await service.updateOperation('wo-1', 'op-1', { status: 'IN_PROGRESS' }, tenantId);

      expect(result.status).toBe('IN_PROGRESS');
    });

    it('should set startedAt on IN_PROGRESS', async () => {
      mockPrisma.workOrderOperation.findFirst.mockResolvedValue({ id: 'op-1', workOrderId: 'wo-1', tenantId });
      mockPrisma.workOrderOperation.update.mockResolvedValue({ id: 'op-1', status: 'IN_PROGRESS', startedAt: new Date() });

      await service.updateOperation('wo-1', 'op-1', { status: 'IN_PROGRESS' }, tenantId);

      expect(mockPrisma.workOrderOperation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ startedAt: expect.any(Date) }),
        }),
      );
    });

    it('should throw NotFound if operation missing', async () => {
      mockPrisma.workOrderOperation.findFirst.mockResolvedValue(null);
      await expect(service.updateOperation('wo-1', 'op-1', { status: 'COMPLETED' }, tenantId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('startOperation', () => {
    it('should set status to IN_PROGRESS', async () => {
      mockPrisma.workOrderOperation.findFirst.mockResolvedValue({ id: 'op-1', workOrderId: 'wo-1', tenantId });
      mockPrisma.workOrderOperation.update.mockResolvedValue({ id: 'op-1', status: 'IN_PROGRESS', startedAt: new Date() });

      const result = await service.startOperation('wo-1', 'op-1', tenantId);

      expect(result.status).toBe('IN_PROGRESS');
    });
  });

  describe('completeOperation', () => {
    it('should complete an in-progress operation', async () => {
      mockPrisma.workOrderOperation.findFirst.mockResolvedValue({ id: 'op-1', workOrderId: 'wo-1', tenantId, status: 'IN_PROGRESS' });
      mockPrisma.workOrderOperation.update.mockResolvedValue({ id: 'op-1', status: 'COMPLETED', completedAt: new Date(), actualMinutes: 30 });

      const result = await service.completeOperation('wo-1', 'op-1', tenantId, 30);

      expect(result.status).toBe('COMPLETED');
      expect(mockPrisma.workOrderOperation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'COMPLETED', actualMinutes: 30 }),
        }),
      );
    });

    it('should throw if operation not in progress', async () => {
      mockPrisma.workOrderOperation.findFirst.mockResolvedValue({ id: 'op-1', workOrderId: 'wo-1', tenantId, status: 'PENDING' });
      await expect(service.completeOperation('wo-1', 'op-1', tenantId)).rejects.toThrow(BadRequestException);
    });
  });
});

describe('ComponentsService', () => {
  let service: ComponentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComponentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ComponentsService);
    jest.clearAllMocks();
  });

  const tenantId = 'tenant-1';

  describe('addComponent', () => {
    it('should add component to DRAFT work order', async () => {
      mockPrisma.workOrder.findFirst.mockResolvedValue({ id: 'wo-1', tenantId, status: 'DRAFT' });
      mockPrisma.workOrderComponent.create.mockResolvedValue({ id: 'comp-1', productId: 'prod-1', quantityRequired: 5 });

      const result = await service.addComponent('wo-1', {
        productId: 'prod-1',
        quantityRequired: 5,
        uomId: 'uom-1',
      }, tenantId);

      expect(result.productId).toBe('prod-1');
    });

    it('should throw if work order not found', async () => {
      mockPrisma.workOrder.findFirst.mockResolvedValue(null);
      await expect(service.addComponent('wo-1', {
        productId: 'prod-1',
        quantityRequired: 5,
        uomId: 'uom-1',
      }, tenantId)).rejects.toThrow(NotFoundException);
    });

    it('should throw if not DRAFT', async () => {
      mockPrisma.workOrder.findFirst.mockResolvedValue({ id: 'wo-1', tenantId, status: 'RELEASED' });
      await expect(service.addComponent('wo-1', {
        productId: 'prod-1',
        quantityRequired: 5,
        uomId: 'uom-1',
      }, tenantId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateConsumedQuantity', () => {
    it('should update consumed quantity', async () => {
      mockPrisma.workOrderComponent.findFirst.mockResolvedValue({ id: 'comp-1', workOrderId: 'wo-1', tenantId });
      mockPrisma.workOrderComponent.update.mockResolvedValue({ id: 'comp-1', quantityConsumed: 3 });

      const result = await service.updateConsumedQuantity('wo-1', 'comp-1', 3, tenantId);

      expect(result.quantityConsumed).toBe(3);
    });

    it('should throw if component not found', async () => {
      mockPrisma.workOrderComponent.findFirst.mockResolvedValue(null);
      await expect(service.updateConsumedQuantity('wo-1', 'comp-1', 3, tenantId)).rejects.toThrow(NotFoundException);
    });
  });
});
