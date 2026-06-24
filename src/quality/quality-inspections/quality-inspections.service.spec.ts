import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QualityInspectionsService } from './quality-inspections.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockPrisma = {
  qualityInspection: {
    count: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  qualityInspectionResult: {
    create: jest.fn(),
  },
  qualityInspectionEvent: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockEventEmitter = { emit: jest.fn() };

describe('QualityInspectionsService', () => {
  let service: QualityInspectionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QualityInspectionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();
    service = module.get(QualityInspectionsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = {
      facilityId: 'fac1',
      inspectionType: 'RECEIVING',
      referenceType: 'GRN',
      referenceId: 'grn-1',
      priority: 'HIGH',
      notes: 'test',
    };
    const tenantId = 'tenant-1';
    const userId = 'user-1';

    it('should create inspection with auto-generated number', async () => {
      mockPrisma.qualityInspection.count.mockResolvedValue(0);
      mockPrisma.qualityInspection.create.mockResolvedValue({ id: 'insp-1', inspectionNumber: 'INSP-FAC1-000001', ...dto, tenantId });
      mockPrisma.qualityInspectionEvent.create.mockResolvedValue({});

      const result = await service.create(dto, tenantId, userId);

      expect(mockPrisma.qualityInspection.count).toHaveBeenCalledWith({
        where: { tenantId, facilityId: dto.facilityId },
      });
      expect(mockPrisma.qualityInspection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId,
            facilityId: dto.facilityId,
            inspectionNumber: 'INSP-FAC1-000001',
            inspectionType: 'RECEIVING',
            status: 'PENDING',
          }),
        }),
      );
      expect(mockPrisma.qualityInspectionEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eventType: 'ASSIGNED', inspectionId: 'insp-1' }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('quality.inspection.created', expect.objectContaining({ inspectionId: 'insp-1' }));
      expect(result.inspectionNumber).toBe('INSP-FAC1-000001');
    });
  });

  describe('findAll', () => {
    it('should filter by status and inspectionType', async () => {
      mockPrisma.qualityInspection.findMany.mockResolvedValue([{ id: 'i-1' }, { id: 'i-2' }]);

      const result = await service.findAll('t-1', { status: 'PENDING', inspectionType: 'RECEIVING' });

      expect(mockPrisma.qualityInspection.findMany).toHaveBeenCalledWith({
        where: { tenantId: 't-1', status: 'PENDING', inspectionType: 'RECEIVING' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('should return inspection with results and events', async () => {
      const mockInspection = { id: 'i-1', results: [], events: [] };
      mockPrisma.qualityInspection.findFirst.mockResolvedValue(mockInspection);

      const result = await service.findById('i-1', 't-1');

      expect(mockPrisma.qualityInspection.findFirst).toHaveBeenCalledWith({
        where: { id: 'i-1', tenantId: 't-1' },
        include: { results: { orderBy: { checkedAt: 'desc' } }, events: { orderBy: { performedAt: 'desc' } } },
      });
      expect(result).toEqual(mockInspection);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.qualityInspection.findFirst.mockResolvedValue(null);
      await expect(service.findById('bad-id', 't-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update status and create completed event', async () => {
      mockPrisma.qualityInspection.findFirst.mockResolvedValue({ id: 'i-1', tenantId: 't-1', status: 'IN_PROGRESS' });
      mockPrisma.qualityInspectionEvent.create.mockResolvedValue({});
      mockPrisma.qualityInspection.update.mockResolvedValue({ id: 'i-1', status: 'PASSED', completedAt: new Date() });

      const result = await service.update('i-1', { status: 'PASSED' }, 't-1', 'u-1');

      expect(mockPrisma.qualityInspection.update).toHaveBeenCalled();
      expect(mockPrisma.qualityInspectionEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eventType: 'COMPLETED' }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('quality.inspection.status_changed', {
        inspectionId: 'i-1', status: 'PASSED', tenantId: 't-1',
      });
      expect(result.status).toBe('PASSED');
    });
  });

  describe('submitResult', () => {
    const dto = { checkType: 'VISUAL', result: 'PASS', notes: 'looks good' };

    it('should create result and advance status to IN_PROGRESS', async () => {
      mockPrisma.qualityInspection.findFirst.mockResolvedValue({ id: 'i-1', tenantId: 't-1', status: 'PENDING' });
      mockPrisma.qualityInspectionResult.create.mockResolvedValue({ id: 'r-1', ...dto });
      mockPrisma.qualityInspectionEvent.create.mockResolvedValue({});
      mockPrisma.qualityInspection.update.mockResolvedValue({ id: 'i-1', status: 'IN_PROGRESS' });

      const result = await service.submitResult('i-1', dto as any, 't-1', 'u-1');

      expect(mockPrisma.qualityInspectionResult.create).toHaveBeenCalled();
      expect(mockPrisma.qualityInspection.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'i-1' }, data: { status: 'IN_PROGRESS' } }),
      );
      expect(result.id).toBe('r-1');
    });

    it('should reject result on completed inspection', async () => {
      mockPrisma.qualityInspection.findFirst.mockResolvedValue({ id: 'i-1', tenantId: 't-1', status: 'PASSED' });
      await expect(service.submitResult('i-1', dto as any, 't-1', 'u-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getEvents', () => {
    it('should return events for an inspection', async () => {
      mockPrisma.qualityInspection.findFirst.mockResolvedValue({ id: 'i-1' });
      mockPrisma.qualityInspectionEvent.findMany.mockResolvedValue([{ id: 'e-1', eventType: 'ASSIGNED' }]);

      const result = await service.getEvents('i-1', 't-1');

      expect(mockPrisma.qualityInspectionEvent.findMany).toHaveBeenCalledWith({
        where: { tenantId: 't-1', inspectionId: 'i-1' },
        orderBy: { performedAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findMyTasks', () => {
    it('should return pending/in-progress inspections for user', async () => {
      mockPrisma.qualityInspection.findMany.mockResolvedValue([{ id: 't-1', status: 'PENDING' }]);
      const result = await service.findMyTasks('t-1', 'u-1');
      expect(mockPrisma.qualityInspection.findMany).toHaveBeenCalledWith({
        where: { tenantId: 't-1', assignedToUserId: 'u-1', status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      });
      expect(result).toHaveLength(1);
    });
  });
});
