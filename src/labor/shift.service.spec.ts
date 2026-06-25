import { Test, TestingModule } from '@nestjs/testing';
import { ShiftService } from './shift.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  laborShift: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  laborShiftAssignment: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('ShiftService', () => {
  let service: ShiftService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShiftService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(ShiftService);
    jest.clearAllMocks();
  });

  it('should create a shift', async () => {
    mockPrisma.laborShift.create.mockResolvedValue({ id: 's-1', shiftCode: 'MORNING' });
    const result = await service.createShift({ facilityId: 'fac-1', shiftCode: 'MORNING', shiftName: 'Morning Shift', startTime: '06:00', endTime: '14:00' }, 't-1');
    expect(result.id).toBe('s-1');
  });

  it('should list shifts', async () => {
    mockPrisma.laborShift.findMany.mockResolvedValue([{ id: 's-1' }]);
    const result = await service.listShifts('t-1', { facilityId: 'fac-1' });
    expect(result).toHaveLength(1);
  });

  it('should update a shift', async () => {
    mockPrisma.laborShift.findFirst.mockResolvedValue({ id: 's-1' });
    mockPrisma.laborShift.update.mockResolvedValue({ id: 's-1', shiftName: 'Evening' });
    const result = await service.updateShift('s-1', { shiftName: 'Evening' }, 't-1');
    expect(result.shiftName).toBe('Evening');
  });

  it('should throw on update when not found', async () => {
    mockPrisma.laborShift.findFirst.mockResolvedValue(null);
    await expect(service.updateShift('bad-id', { shiftName: 'X' }, 't-1')).rejects.toThrow(NotFoundException);
  });

  it('should assign shift', async () => {
    mockPrisma.laborShift.findFirst.mockResolvedValue({ id: 's-1' });
    mockPrisma.laborShiftAssignment.create.mockResolvedValue({ id: 'a-1' });
    const result = await service.assignShift({ facilityId: 'fac-1', shiftId: 's-1', userId: 'u-1', effectiveDate: '2026-06-25' }, 't-1');
    expect(result.id).toBe('a-1');
  });

  it('should throw on assign when shift not found', async () => {
    mockPrisma.laborShift.findFirst.mockResolvedValue(null);
    await expect(service.assignShift({ facilityId: 'fac-1', shiftId: 'bad', userId: 'u-1', effectiveDate: '2026-06-25' }, 't-1')).rejects.toThrow(NotFoundException);
  });

  it('should list assignments', async () => {
    mockPrisma.laborShiftAssignment.findMany.mockResolvedValue([{ id: 'a-1' }]);
    const result = await service.listAssignments('t-1', { userId: 'u-1' });
    expect(result).toHaveLength(1);
  });
});
