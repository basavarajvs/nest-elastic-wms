import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: any;

  const mockPrisma = {
    systemAuditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prisma = mockPrisma;
  });

  afterEach(() => jest.clearAllMocks());

  describe('write', () => {
    it('should create an audit log entry', async () => {
      const entry = { id: 'log-1', tenantId: 'tenant-1', action: 'CREATE', entityType: 'WorkOrder', entityId: 'wo-1' };
      mockPrisma.systemAuditLog.create.mockResolvedValue(entry);

      const result = await service.write({
        tenantId: 'tenant-1',
        action: 'CREATE',
        entityType: 'WorkOrder',
        entityId: 'wo-1',
        changedByUserId: 'user-1',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });

      expect(mockPrisma.systemAuditLog.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          facilityId: undefined,
          action: 'CREATE',
          entityType: 'WorkOrder',
          entityId: 'wo-1',
          oldValue: undefined,
          newValue: undefined,
          changedByUserId: 'user-1',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        },
      });
      expect(result).toEqual(entry);
    });

    it('should include old/new values when provided', async () => {
      mockPrisma.systemAuditLog.create.mockResolvedValue({ id: 'log-2' });

      await service.write({
        tenantId: 'tenant-1',
        action: 'UPDATE',
        entityType: 'Product',
        entityId: 'prod-1',
        oldValue: { status: 'DRAFT' },
        newValue: { status: 'ACTIVE' },
      });

      expect(mockPrisma.systemAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          oldValue: { status: 'DRAFT' },
          newValue: { status: 'ACTIVE' },
        }),
      });
    });

    it('should return null on error without throwing', async () => {
      mockPrisma.systemAuditLog.create.mockRejectedValue(new Error('DB error'));

      const result = await service.write({
        tenantId: 'tenant-1',
        action: 'CREATE',
        entityType: 'Test',
        entityId: 'test-1',
      });

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      const items = [{ id: 'log-1' }, { id: 'log-2' }];
      mockPrisma.systemAuditLog.findMany.mockResolvedValue(items);
      mockPrisma.systemAuditLog.count.mockResolvedValue(2);

      const result = await service.findAll('tenant-1', { action: 'CREATE' });

      expect(mockPrisma.systemAuditLog.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', action: 'CREATE' },
        orderBy: { occurredAt: 'desc' },
        take: 50,
        skip: 0,
      });
      expect(result).toEqual({ items, total: 2 });
    });

    it('should apply date range filters', async () => {
      mockPrisma.systemAuditLog.findMany.mockResolvedValue([]);
      mockPrisma.systemAuditLog.count.mockResolvedValue(0);

      await service.findAll('tenant-1', {
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      });

      expect(mockPrisma.systemAuditLog.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          occurredAt: {
            gte: new Date('2026-01-01'),
            lte: new Date('2026-12-31'),
          },
        },
        orderBy: { occurredAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('should respect limit and offset', async () => {
      mockPrisma.systemAuditLog.findMany.mockResolvedValue([]);
      mockPrisma.systemAuditLog.count.mockResolvedValue(0);

      await service.findAll('tenant-1', { limit: 10, offset: 20 });

      expect(mockPrisma.systemAuditLog.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        orderBy: { occurredAt: 'desc' },
        take: 10,
        skip: 20,
      });
    });
  });
});
