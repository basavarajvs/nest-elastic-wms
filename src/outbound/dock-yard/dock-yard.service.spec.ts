import { Test, TestingModule } from '@nestjs/testing';
import { DockYardService } from './dock-yard.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockPrisma = {
  dockAppointment: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  yardVehicle: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

describe('DockYardService', () => {
  let service: DockYardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DockYardService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(DockYardService);
    jest.clearAllMocks();
  });

  const baseApt = {
    facilityId: 'fac-1',
    dockId: 'dock-1',
    appointmentNumber: 'APT-001',
    appointmentType: 'RECEIVING',
    scheduledStart: '2026-06-25T08:00:00Z',
    scheduledEnd: '2026-06-25T10:00:00Z',
  };

  describe('createAppointment', () => {
    it('should create a dock appointment', async () => {
      mockPrisma.dockAppointment.create.mockResolvedValue({ id: 'apt-1', ...baseApt });
      const result = await service.createAppointment(baseApt, 't-1');
      expect(mockPrisma.dockAppointment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ appointmentNumber: 'APT-001' }) }),
      );
      expect(result.id).toBe('apt-1');
    });
  });

  describe('listAppointments', () => {
    it('should filter by dockId and status', async () => {
      mockPrisma.dockAppointment.findMany.mockResolvedValue([{ id: 'apt-1' }]);
      const result = await service.listAppointments('t-1', { facilityId: 'fac-1', dockId: 'dock-1', status: 'SCHEDULED' });
      expect(mockPrisma.dockAppointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ dockId: 'dock-1', status: 'SCHEDULED' }) }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('checkIn', () => {
    it('should update status and set actualArrival', async () => {
      mockPrisma.dockAppointment.findFirst.mockResolvedValue({ id: 'apt-1', status: 'SCHEDULED' });
      mockPrisma.dockAppointment.update.mockResolvedValue({ id: 'apt-1', status: 'CHECKED_IN' });
      const result = await service.checkIn('apt-1', 't-1');
      expect(mockPrisma.dockAppointment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'CHECKED_IN', actualArrival: expect.any(Date) }) }),
      );
      expect(result.status).toBe('CHECKED_IN');
    });

    it('should throw when not SCHEDULED', async () => {
      mockPrisma.dockAppointment.findFirst.mockResolvedValue({ id: 'apt-1', status: 'COMPLETED' });
      await expect(service.checkIn('apt-1', 't-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('complete', () => {
    it('should complete an appointment', async () => {
      mockPrisma.dockAppointment.findFirst.mockResolvedValue({ id: 'apt-1', status: 'CHECKED_IN' });
      mockPrisma.dockAppointment.update.mockResolvedValue({ id: 'apt-1', status: 'COMPLETED' });
      const result = await service.complete('apt-1', 't-1');
      expect(result.status).toBe('COMPLETED');
    });

    it('should throw on already completed', async () => {
      mockPrisma.dockAppointment.findFirst.mockResolvedValue({ id: 'apt-1', status: 'COMPLETED' });
      await expect(service.complete('apt-1', 't-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('should cancel an appointment', async () => {
      mockPrisma.dockAppointment.findFirst.mockResolvedValue({ id: 'apt-1', status: 'SCHEDULED' });
      mockPrisma.dockAppointment.update.mockResolvedValue({ id: 'apt-1', status: 'CANCELLED' });
      const result = await service.cancel('apt-1', 't-1');
      expect(result.status).toBe('CANCELLED');
    });

    it('should throw when not found', async () => {
      mockPrisma.dockAppointment.findFirst.mockResolvedValue(null);
      await expect(service.cancel('bad-id', 't-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('yard vehicles', () => {
    it('should register a vehicle', async () => {
      mockPrisma.yardVehicle.create.mockResolvedValue({ id: 'v-1', vehiclePlate: 'ABC-123' });
      const result = await service.registerVehicle({ facilityId: 'fac-1', vehicleType: 'TRUCK', vehiclePlate: 'ABC-123' }, 't-1');
      expect(mockPrisma.yardVehicle.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ vehiclePlate: 'ABC-123', arrivedAt: expect.any(Date) }) }),
      );
      expect(result.vehiclePlate).toBe('ABC-123');
    });

    it('should list vehicles', async () => {
      mockPrisma.yardVehicle.findMany.mockResolvedValue([{ id: 'v-1' }]);
      const result = await service.listVehicles('t-1', { facilityId: 'fac-1' });
      expect(result).toHaveLength(1);
    });

    it('should assign dock', async () => {
      mockPrisma.yardVehicle.findFirst.mockResolvedValue({ id: 'v-1', status: 'IN_YARD' });
      mockPrisma.yardVehicle.update.mockResolvedValue({ id: 'v-1', status: 'AT_DOCK' });
      const result = await service.assignDock('v-1', 'dock-1', 't-1');
      expect(result.status).toBe('AT_DOCK');
    });

    it('should depart vehicle', async () => {
      mockPrisma.yardVehicle.findFirst.mockResolvedValue({ id: 'v-1', status: 'AT_DOCK' });
      mockPrisma.yardVehicle.update.mockResolvedValue({ id: 'v-1', status: 'DEPARTED' });
      const result = await service.departVehicle('v-1', 't-1');
      expect(result.status).toBe('DEPARTED');
    });
  });

  describe('getUpcoming', () => {
    it('should return today\'s active appointments', async () => {
      mockPrisma.dockAppointment.findMany.mockResolvedValue([{ id: 'apt-1' }]);
      const result = await service.getUpcoming('t-1', 'fac-1');
      expect(mockPrisma.dockAppointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['SCHEDULED', 'CHECKED_IN', 'LOADING'] },
          }),
        }),
      );
      expect(result).toHaveLength(1);
    });
  });
});
