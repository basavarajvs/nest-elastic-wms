import { Test, TestingModule } from '@nestjs/testing';
import { FulfillmentWorkflowService } from './fulfillment-workflow.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('FulfillmentWorkflowService', () => {
  let service: FulfillmentWorkflowService;
  let prisma: any;
  let eventEmitter: any;

  const mockPrisma = {
    fulfillmentWorkflowEvent: { create: jest.fn(), findMany: jest.fn() },
    fulfillmentWorkflowTransition: { create: jest.fn(), findMany: jest.fn() },
    wmsExecutionInstance: { findFirst: jest.fn() },
  };

  const mockEventEmitter = { emit: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FulfillmentWorkflowService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<FulfillmentWorkflowService>(FulfillmentWorkflowService);
    prisma = mockPrisma;
    eventEmitter = mockEventEmitter;
  });

  afterEach(() => jest.clearAllMocks());

  describe('recordEvent', () => {
    it('should record a workflow event', async () => {
      const event = { id: 'evt-1', instanceId: 'inst-1', eventType: 'TASK_COMPLETED' };
      mockPrisma.fulfillmentWorkflowEvent.create.mockResolvedValue(event);

      const result = await service.recordEvent({
        tenantId: 'tenant-1',
        instanceId: 'inst-1',
        eventType: 'TASK_COMPLETED',
        recordedBy: 'user-1',
      });

      expect(mockPrisma.fulfillmentWorkflowEvent.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          instanceId: 'inst-1',
          eventType: 'TASK_COMPLETED',
          eventPayload: undefined,
          recordedBy: 'user-1',
        },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('fulfillment.workflow.event', event);
      expect(result).toEqual(event);
    });
  });

  describe('recordTransition', () => {
    it('should record a state transition', async () => {
      const transition = { id: 'tr-1', instanceId: 'inst-1', fromState: 'PENDING', toState: 'IN_PROGRESS' };
      mockPrisma.fulfillmentWorkflowTransition.create.mockResolvedValue(transition);

      const result = await service.recordTransition({
        tenantId: 'tenant-1',
        instanceId: 'inst-1',
        fromState: 'PENDING',
        toState: 'IN_PROGRESS',
        transition: 'START',
      });

      expect(mockPrisma.fulfillmentWorkflowTransition.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          instanceId: 'inst-1',
          fromState: 'PENDING',
          toState: 'IN_PROGRESS',
          transition: 'START',
          context: undefined,
          triggeredBy: undefined,
        },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('fulfillment.workflow.transition', transition);
      expect(result).toEqual(transition);
    });
  });

  describe('getEvents', () => {
    it('should return events for an instance', async () => {
      const events = [{ id: 'evt-1' }, { id: 'evt-2' }];
      mockPrisma.wmsExecutionInstance.findFirst.mockResolvedValue({ id: 'inst-1' });
      mockPrisma.fulfillmentWorkflowEvent.findMany.mockResolvedValue(events);

      const result = await service.getEvents('inst-1', 'tenant-1');

      expect(mockPrisma.fulfillmentWorkflowEvent.findMany).toHaveBeenCalledWith({
        where: { instanceId: 'inst-1', tenantId: 'tenant-1' },
        orderBy: { recordedAt: 'asc' },
      });
      expect(result).toEqual(events);
    });

    it('should throw NotFoundException when instance not found', async () => {
      mockPrisma.wmsExecutionInstance.findFirst.mockResolvedValue(null);

      await expect(service.getEvents('bad-id', 'tenant-1')).rejects.toThrow('Execution instance not found');
    });
  });

  describe('getTransitions', () => {
    it('should return transitions for an instance', async () => {
      const transitions = [{ id: 'tr-1' }];
      mockPrisma.wmsExecutionInstance.findFirst.mockResolvedValue({ id: 'inst-1' });
      mockPrisma.fulfillmentWorkflowTransition.findMany.mockResolvedValue(transitions);

      const result = await service.getTransitions('inst-1', 'tenant-1');

      expect(mockPrisma.fulfillmentWorkflowTransition.findMany).toHaveBeenCalledWith({
        where: { instanceId: 'inst-1', tenantId: 'tenant-1' },
        orderBy: { triggeredAt: 'asc' },
      });
      expect(result).toEqual(transitions);
    });

    it('should throw NotFoundException when instance not found', async () => {
      mockPrisma.wmsExecutionInstance.findFirst.mockResolvedValue(null);

      await expect(service.getTransitions('bad-id', 'tenant-1')).rejects.toThrow('Execution instance not found');
    });
  });
});
