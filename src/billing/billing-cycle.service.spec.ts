import { Test, TestingModule } from '@nestjs/testing';
import { BillingCycleService } from './billing-cycle.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  billingCycle: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('BillingCycleService', () => {
  let service: BillingCycleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BillingCycleService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(BillingCycleService);
    jest.clearAllMocks();
  });

  it('should create a billing cycle', async () => {
    mockPrisma.billingCycle.create.mockResolvedValue({ id: 'cycle-1', cycleCode: 'MONTHLY' });
    const result = await service.create({ facilityId: 'fac-1', cycleCode: 'MONTHLY', cycleName: 'Monthly Billing', frequency: 'MONTHLY', billingDay: 1 }, 't-1');
    expect(result.id).toBe('cycle-1');
  });

  it('should list cycles filtered by facility', async () => {
    mockPrisma.billingCycle.findMany.mockResolvedValue([{ id: 'cycle-1' }]);
    const result = await service.list('t-1', { facilityId: 'fac-1' });
    expect(mockPrisma.billingCycle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 't-1', facilityId: 'fac-1' } }),
    );
    expect(result).toHaveLength(1);
  });
});
