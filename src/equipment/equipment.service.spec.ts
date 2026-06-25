import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentService } from './equipment.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const mockPrisma = {
  warehouseEquipment: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

describe('EquipmentService', () => {
  let service: EquipmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EquipmentService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(EquipmentService);
    jest.clearAllMocks();
  });

  const baseEquipment = {
    facilityId: 'fac-1',
    equipmentCode: 'FORK-001',
    equipmentName: 'Forklift 1',
    equipmentType: 'FORKLIFT',
  };

  describe('create', () => {
    it('should create equipment with default status AVAILABLE', async () => {
      mockPrisma.warehouseEquipment.create.mockResolvedValue({ id: 'eq-1', ...baseEquipment, status: 'AVAILABLE' });
      const result = await service.create(baseEquipment, 't-1');
      expect(mockPrisma.warehouseEquipment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ equipmentCode: 'FORK-001' }) }),
      );
      expect(result.id).toBe('eq-1');
    });
  });

  describe('list', () => {
    it('should filter by facilityId', async () => {
      mockPrisma.warehouseEquipment.findMany.mockResolvedValue([{ id: 'eq-1' }]);
      const result = await service.list('t-1', { facilityId: 'fac-1' });
      expect(mockPrisma.warehouseEquipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ facilityId: 'fac-1' }) }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update equipment fields', async () => {
      mockPrisma.warehouseEquipment.findFirst.mockResolvedValue({ id: 'eq-1' });
      mockPrisma.warehouseEquipment.update.mockResolvedValue({ id: 'eq-1', equipmentName: 'Updated' });
      const result = await service.update('eq-1', { equipmentName: 'Updated' }, 't-1');
      expect(mockPrisma.warehouseEquipment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { equipmentName: 'Updated' } }),
      );
      expect(result.equipmentName).toBe('Updated');
    });

    it('should throw when not found', async () => {
      mockPrisma.warehouseEquipment.findFirst.mockResolvedValue(null);
      await expect(service.update('bad-id', { equipmentName: 'nope' }, 't-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('changeStatus', () => {
    it('should change status', async () => {
      mockPrisma.warehouseEquipment.findFirst.mockResolvedValue({ id: 'eq-1' });
      mockPrisma.warehouseEquipment.update.mockResolvedValue({ id: 'eq-1', status: 'MAINTENANCE' });
      const result = await service.changeStatus('eq-1', { status: 'MAINTENANCE' }, 't-1');
      expect(result.status).toBe('MAINTENANCE');
    });
  });

  describe('checkOut', () => {
    it('should check out available equipment', async () => {
      mockPrisma.warehouseEquipment.findFirst.mockResolvedValue({ id: 'eq-1', status: 'AVAILABLE' });
      mockPrisma.warehouseEquipment.update.mockResolvedValue({ id: 'eq-1', status: 'IN_USE' });
      const result = await service.checkOut('eq-1', 't-1');
      expect(result.status).toBe('IN_USE');
    });

    it('should throw when not AVAILABLE', async () => {
      mockPrisma.warehouseEquipment.findFirst.mockResolvedValue({ id: 'eq-1', status: 'IN_USE' });
      await expect(service.checkOut('eq-1', 't-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkIn', () => {
    it('should check in in-use equipment', async () => {
      mockPrisma.warehouseEquipment.findFirst.mockResolvedValue({ id: 'eq-1', status: 'IN_USE' });
      mockPrisma.warehouseEquipment.update.mockResolvedValue({ id: 'eq-1', status: 'AVAILABLE' });
      const result = await service.checkIn('eq-1', 't-1');
      expect(result.status).toBe('AVAILABLE');
    });

    it('should throw when not IN_USE', async () => {
      mockPrisma.warehouseEquipment.findFirst.mockResolvedValue({ id: 'eq-1', status: 'AVAILABLE' });
      await expect(service.checkIn('eq-1', 't-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('listAvailable', () => {
    it('should return only AVAILABLE equipment', async () => {
      mockPrisma.warehouseEquipment.findMany.mockResolvedValue([{ id: 'eq-1', status: 'AVAILABLE' }]);
      const result = await service.listAvailable('t-1', 'fac-1');
      expect(mockPrisma.warehouseEquipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'AVAILABLE' }) }),
      );
      expect(result).toHaveLength(1);
    });
  });
});
