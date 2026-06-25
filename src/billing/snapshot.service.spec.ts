import { Test, TestingModule } from '@nestjs/testing';
import { SnapshotService } from './snapshot.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  inventoryOnHand: { findMany: jest.fn() },
  storageRateMaster: { findMany: jest.fn() },
  storageInventorySnapshot: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  storageCharge: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('SnapshotService', () => {
  let service: SnapshotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SnapshotService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(SnapshotService);
    jest.clearAllMocks();
  });

  describe('generateSnapshot', () => {
    it('should create snapshots from inventory items', async () => {
      mockPrisma.inventoryOnHand.findMany.mockResolvedValue([
        { productId: 'p-1', locationId: 'loc-1', quantityOnHand: 10 },
        { productId: 'p-2', locationId: 'loc-2', quantityOnHand: 5 },
      ]);
      mockPrisma.storageRateMaster.findMany.mockResolvedValue([
        { id: 'rate-1', rateType: 'PER_PALLET', defaultRate: 5, clientRates: [] },
      ]);
      mockPrisma.storageInventorySnapshot.findFirst.mockResolvedValue(null);
      mockPrisma.storageInventorySnapshot.create.mockResolvedValueOnce({ id: 'ss-1', quantity: 10 });
      mockPrisma.storageInventorySnapshot.create.mockResolvedValueOnce({ id: 'ss-2', quantity: 5 });

      const result = await service.generateSnapshot({ facilityId: 'fac-1', snapshotDate: '2026-06-24', clientId: 'c-1' }, 't-1');

      expect(result.created).toBe(2);
      expect(mockPrisma.storageInventorySnapshot.create).toHaveBeenCalledTimes(2);
    });

    it('should skip existing snapshots', async () => {
      mockPrisma.inventoryOnHand.findMany.mockResolvedValue([
        { productId: 'p-1', locationId: 'loc-1', quantityOnHand: 10 },
      ]);
      mockPrisma.storageRateMaster.findMany.mockResolvedValue([]);
      mockPrisma.storageInventorySnapshot.findFirst.mockResolvedValue({ id: 'existing' });

      const result = await service.generateSnapshot({ facilityId: 'fac-1', snapshotDate: '2026-06-24', clientId: 'c-1' }, 't-1');

      expect(result.created).toBe(0);
      expect(mockPrisma.storageInventorySnapshot.create).not.toHaveBeenCalled();
    });

    it('should return empty when no inventory', async () => {
      mockPrisma.inventoryOnHand.findMany.mockResolvedValue([]);
      const result = await service.generateSnapshot({ facilityId: 'fac-1', snapshotDate: '2026-06-24', clientId: 'c-1' }, 't-1');
      expect(result.created).toBe(0);
    });
  });

  describe('calculateCharges', () => {
    it('should group snapshots by client+product and create charges', async () => {
      mockPrisma.storageInventorySnapshot.findMany.mockResolvedValue([
        { clientId: 'c-1', productId: 'p-1', quantity: 10, chargeAmount: 50 },
        { clientId: 'c-1', productId: 'p-1', quantity: 5, chargeAmount: 25 },
      ]);
      mockPrisma.storageCharge.create.mockResolvedValue({ id: 'chg-1', amount: 75 });

      const result = await service.calculateCharges('t-1', { facilityId: 'fac-1', periodStart: '2026-06-01', periodEnd: '2026-06-30' });

      expect(result.created).toBe(1);
      expect(mockPrisma.storageCharge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ amount: 75 }),
        }),
      );
    });

    it('should return empty when no snapshots found', async () => {
      mockPrisma.storageInventorySnapshot.findMany.mockResolvedValue([]);
      const result = await service.calculateCharges('t-1', { facilityId: 'fac-1', periodStart: '2026-06-01', periodEnd: '2026-06-30' });
      expect(result.created).toBe(0);
    });
  });

  describe('listSnapshots / listCharges', () => {
    it('should list snapshots with filters', async () => {
      mockPrisma.storageInventorySnapshot.findMany.mockResolvedValue([{ id: 'ss-1' }]);
      const result = await service.listSnapshots('t-1', { facilityId: 'fac-1', clientId: 'c-1' });
      expect(result).toHaveLength(1);
    });

    it('should list charges with filters', async () => {
      mockPrisma.storageCharge.findMany.mockResolvedValue([{ id: 'chg-1' }]);
      const result = await service.listCharges('t-1', { facilityId: 'fac-1', status: 'PENDING' });
      expect(mockPrisma.storageCharge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'PENDING' }) }),
      );
      expect(result).toHaveLength(1);
    });
  });
});
