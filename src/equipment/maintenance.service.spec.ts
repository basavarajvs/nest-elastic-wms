import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceService } from './maintenance.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const mockPrisma = {
  warehouseEquipment: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  equipmentMaintenance: {
    count: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

describe('MaintenanceService', () => {
  let service: MaintenanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MaintenanceService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(MaintenanceService);
    jest.clearAllMocks();
  });

  const baseMaint = {
    equipmentId: 'eq-1',
    maintenanceType: 'PREVENTIVE',
  };

  describe('create', () => {
    it('should create maintenance record and set equipment to MAINTENANCE', async () => {
      mockPrisma.warehouseEquipment.findFirst.mockResolvedValue({ id: 'eq-1', facilityId: 'fac-1' });
      mockPrisma.equipmentMaintenance.count.mockResolvedValue(0);
      mockPrisma.equipmentMaintenance.create.mockResolvedValue({ id: 'mnt-1', maintenanceNumber: 'MNT-000001' });
      mockPrisma.warehouseEquipment.update.mockResolvedValue({ id: 'eq-1', status: 'MAINTENANCE' });

      const result = await service.create(baseMaint, 't-1');
      expect(mockPrisma.equipmentMaintenance.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ maintenanceNumber: 'MNT-000001' }) }),
      );
      expect(mockPrisma.warehouseEquipment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'MAINTENANCE' } }),
      );
      expect(result.id).toBe('mnt-1');
    });

    it('should throw when equipment not found', async () => {
      mockPrisma.warehouseEquipment.findFirst.mockResolvedValue(null);
      await expect(service.create(baseMaint, 't-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('should list maintenance records with equipment include', async () => {
      mockPrisma.equipmentMaintenance.findMany.mockResolvedValue([{ id: 'mnt-1', equipment: { id: 'eq-1' } }]);
      const result = await service.list('t-1', { facilityId: 'fac-1' });
      expect(mockPrisma.equipmentMaintenance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ include: { equipment: true } }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('complete', () => {
    it('should complete maintenance and set equipment to AVAILABLE', async () => {
      mockPrisma.equipmentMaintenance.findFirst.mockResolvedValue({ id: 'mnt-1', equipmentId: 'eq-1', status: 'IN_PROGRESS' });
      mockPrisma.equipmentMaintenance.update.mockResolvedValue({ id: 'mnt-1', status: 'COMPLETED' });
      mockPrisma.warehouseEquipment.update.mockResolvedValue({ id: 'eq-1', status: 'AVAILABLE', lastMaintenanceAt: new Date() });

      const result = await service.complete('mnt-1', {}, 't-1');
      expect(mockPrisma.warehouseEquipment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'AVAILABLE', lastMaintenanceAt: expect.any(Date) }) }),
      );
      expect(result.status).toBe('COMPLETED');
    });

    it('should throw when already COMPLETED', async () => {
      mockPrisma.equipmentMaintenance.findFirst.mockResolvedValue({ id: 'mnt-1', status: 'COMPLETED' });
      await expect(service.complete('mnt-1', {}, 't-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw when not found', async () => {
      mockPrisma.equipmentMaintenance.findFirst.mockResolvedValue(null);
      await expect(service.complete('bad-id', {}, 't-1')).rejects.toThrow(NotFoundException);
    });
  });
});
