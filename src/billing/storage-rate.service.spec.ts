import { Test, TestingModule } from '@nestjs/testing';
import { StorageRateService } from './storage-rate.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  storageRateMaster: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  storageClientRate: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('StorageRateService', () => {
  let service: StorageRateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageRateService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(StorageRateService);
    jest.clearAllMocks();
  });

  const baseRate = {
    facilityId: 'fac-1',
    rateCode: 'PALLET-STD',
    rateName: 'Standard Pallet Storage',
    rateType: 'PER_PALLET',
    calculationBasis: 'MONTHLY',
    defaultRate: 5.0,
  };

  it('should create a rate', async () => {
    mockPrisma.storageRateMaster.create.mockResolvedValue({ id: 'rate-1', ...baseRate });
    const result = await service.createRate(baseRate, 't-1');
    expect(mockPrisma.storageRateMaster.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ rateCode: 'PALLET-STD' }) }),
    );
    expect(result.id).toBe('rate-1');
  });

  it('should list rates with filters', async () => {
    mockPrisma.storageRateMaster.findMany.mockResolvedValue([{ id: 'rate-1' }]);
    const result = await service.listRates('t-1', { facilityId: 'fac-1', rateType: 'PER_PALLET' });
    expect(mockPrisma.storageRateMaster.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 't-1', facilityId: 'fac-1', rateType: 'PER_PALLET' }) }),
    );
    expect(result).toHaveLength(1);
  });

  it('should get rate by id', async () => {
    mockPrisma.storageRateMaster.findFirst.mockResolvedValue({ id: 'rate-1', clientRates: [] });
    const result = await service.getRate('rate-1', 't-1');
    expect(result.id).toBe('rate-1');
  });

  it('should throw on getRate not found', async () => {
    mockPrisma.storageRateMaster.findFirst.mockResolvedValue(null);
    await expect(service.getRate('bad-id', 't-1')).rejects.toThrow(NotFoundException);
  });

  it('should set client rate', async () => {
    mockPrisma.storageRateMaster.findFirst.mockResolvedValue({ id: 'rate-1' });
    mockPrisma.storageClientRate.create.mockResolvedValue({ id: 'cr-1', negotiatedRate: 4.5 });
    const result = await service.setClientRate({ rateMasterId: 'rate-1', clientId: 'c-1', negotiatedRate: 4.5 }, 't-1');
    expect(result.id).toBe('cr-1');
  });

  it('should throw on setClientRate when rate master not found', async () => {
    mockPrisma.storageRateMaster.findFirst.mockResolvedValue(null);
    await expect(service.setClientRate({ rateMasterId: 'bad', clientId: 'c-1', negotiatedRate: 4.5 }, 't-1')).rejects.toThrow(NotFoundException);
  });

  it('should list client rates', async () => {
    mockPrisma.storageClientRate.findMany.mockResolvedValue([{ id: 'cr-1' }]);
    const result = await service.listClientRates('t-1', { clientId: 'c-1' });
    expect(result).toHaveLength(1);
  });
});
