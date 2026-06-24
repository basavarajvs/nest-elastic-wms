import { Test, TestingModule } from '@nestjs/testing';
import { VasCatalogService } from './vas-catalog.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  vasService: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  vasServiceClientRate: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  vasWorkstation: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

describe('VasCatalogService', () => {
  let service: VasCatalogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VasCatalogService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(VasCatalogService);
    jest.clearAllMocks();
  });

  describe('createService', () => {
    const dto = {
      serviceCode: 'KIT-A',
      serviceName: 'Basic Kitting',
      category: 'KITTING',
      defaultRate: 5.50,
      estimatedTimeMinutes: 15,
    };

    it('should create a VAS service', async () => {
      mockPrisma.vasService.create.mockResolvedValue({ id: 'svc-1', ...dto, tenantId: 't-1' });

      const result = await service.createService(dto, 't-1');

      expect(mockPrisma.vasService.create).toHaveBeenCalledWith({
        data: { ...dto, tenantId: 't-1', isActive: true },
      });
      expect(result.id).toBe('svc-1');
    });
  });

  describe('listServices', () => {
    it('should filter by category', async () => {
      mockPrisma.vasService.findMany.mockResolvedValue([{ id: 'svc-1', category: 'KITTING' }]);

      const result = await service.listServices('t-1', { category: 'KITTING' });

      expect(mockPrisma.vasService.findMany).toHaveBeenCalledWith({
        where: { tenantId: 't-1', category: 'KITTING' },
        orderBy: { serviceCode: 'asc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('updateService', () => {
    it('should update existing service', async () => {
      mockPrisma.vasService.findFirst.mockResolvedValue({ id: 'svc-1' });
      mockPrisma.vasService.update.mockResolvedValue({ id: 'svc-1', serviceName: 'Updated' });

      const result = await service.updateService('svc-1', { serviceName: 'Updated' }, 't-1');

      expect(mockPrisma.vasService.update).toHaveBeenCalledWith({
        where: { id: 'svc-1' },
        data: { serviceName: 'Updated' },
      });
      expect(result.serviceName).toBe('Updated');
    });

    it('should throw when service not found', async () => {
      mockPrisma.vasService.findFirst.mockResolvedValue(null);
      await expect(service.updateService('bad-id', { serviceName: 'x' }, 't-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('setClientRate', () => {
    const dto = {
      serviceId: 'svc-1',
      clientId: 'client-1',
      ratePerUnit: 4.75,
      currency: 'USD',
    };

    it('should create a client rate', async () => {
      mockPrisma.vasService.findFirst.mockResolvedValue({ id: 'svc-1' });
      mockPrisma.vasServiceClientRate.create.mockResolvedValue({ id: 'rate-1', ...dto, tenantId: 't-1' });

      const result = await service.setClientRate(dto, 't-1');

      expect(mockPrisma.vasServiceClientRate.create).toHaveBeenCalled();
      expect(result.id).toBe('rate-1');
    });

    it('should throw when service not found', async () => {
      mockPrisma.vasService.findFirst.mockResolvedValue(null);
      await expect(service.setClientRate(dto, 't-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('lookupRate', () => {
    it('should return client-specific rate when found', async () => {
      mockPrisma.vasServiceClientRate.findFirst.mockResolvedValue({ ratePerUnit: 4.75 });

      const result = await service.lookupRate('svc-1', 'client-1', 't-1');

      expect(result.ratePerUnit).toBe(4.75);
    });

    it('should fallback to default rate when no client rate', async () => {
      mockPrisma.vasServiceClientRate.findFirst.mockResolvedValue(null);
      mockPrisma.vasService.findFirst.mockResolvedValue({ defaultRate: 5.50 });

      const result = await service.lookupRate('svc-1', 'client-1', 't-1');

      expect(result.ratePerUnit).toBe(5.50);
    });

    it('should return null when no rate found at all', async () => {
      mockPrisma.vasServiceClientRate.findFirst.mockResolvedValue(null);
      mockPrisma.vasService.findFirst.mockResolvedValue({ defaultRate: null });

      const result = await service.lookupRate('svc-1', 'client-1', 't-1');

      expect(result.ratePerUnit).toBeNull();
    });
  });

  describe('createWorkstation', () => {
    const dto = {
      facilityId: 'fac-1',
      workstationCode: 'KIT-01',
      workstationName: 'Kitting Station 1',
      stationType: 'KITTING',
    };

    it('should create a workstation', async () => {
      mockPrisma.vasWorkstation.create.mockResolvedValue({ id: 'ws-1', ...dto, tenantId: 't-1' });

      const result = await service.createWorkstation(dto, 't-1');

      expect(mockPrisma.vasWorkstation.create).toHaveBeenCalled();
      expect(result.id).toBe('ws-1');
    });
  });

  describe('listWorkstations', () => {
    it('should filter by facility and availability', async () => {
      mockPrisma.vasWorkstation.findMany.mockResolvedValue([{ id: 'ws-1', isAvailable: true }]);

      const result = await service.listWorkstations('t-1', { facilityId: 'fac-1', isAvailable: 'true' });

      expect(mockPrisma.vasWorkstation.findMany).toHaveBeenCalledWith({
        where: { tenantId: 't-1', facilityId: 'fac-1', isAvailable: true },
        orderBy: { workstationCode: 'asc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('updateWorkstation', () => {
    it('should toggle availability', async () => {
      mockPrisma.vasWorkstation.findFirst.mockResolvedValue({ id: 'ws-1' });
      mockPrisma.vasWorkstation.update.mockResolvedValue({ id: 'ws-1', isAvailable: false });

      const result = await service.updateWorkstation('ws-1', { isAvailable: false }, 't-1');

      expect(mockPrisma.vasWorkstation.update).toHaveBeenCalledWith({
        where: { id: 'ws-1' },
        data: { isAvailable: false },
      });
      expect(result.isAvailable).toBe(false);
    });
  });
});
