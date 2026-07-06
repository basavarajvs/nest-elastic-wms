import { NotFoundException } from '@nestjs/common';
import { CycleCountService } from './cycle-count.service';

describe('CycleCountService', () => {
  let service: CycleCountService;
  const tenantId = 'test-tenant-uuid';
  const facilityId = BigInt(1);

  const mockCount = {
    count_id: BigInt(1),
    tenant_id: tenantId,
    facility_id: facilityId,
    count_number: 'CC-001',
    status: 'IN_PROGRESS',
    completed_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    version: BigInt(0),
  };

  const mockLine = {
    count_line_id: BigInt(1),
    tenant_id: tenantId,
    facility_id: facilityId,
    count_id: BigInt(1),
    product_id: BigInt(100),
    location_id: BigInt(50),
    counted_quantity: 95,
    system_quantity: 100,
  };

  const mockInv = {
    investigation_id: BigInt(1),
    tenant_id: tenantId,
    facility_id: facilityId,
    count_id: BigInt(1),
    product_id: BigInt(100),
    location_id: BigInt(50),
    variance_quantity: 5,
    system_quantity: 100,
    counted_quantity: 95,
    status: 'OPEN',
  };

  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      inventory_counts: {
        findFirst: jest.fn().mockResolvedValue(mockCount),
        findMany: jest.fn().mockResolvedValue([mockCount]),
        create: jest.fn().mockResolvedValue(mockCount),
        update: jest.fn().mockResolvedValue(mockCount),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      inventory_count_lines: {
        findMany: jest.fn().mockResolvedValue([mockLine]),
        update: jest.fn().mockResolvedValue(mockLine),
      },
      inventory_on_hand: {
        findMany: jest.fn().mockResolvedValue([{ quantity_on_hand: 100, product_id: BigInt(100), location_id: BigInt(50) }]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      inventory_transactions: {
        create: jest.fn().mockResolvedValue({}),
      },
      variance_investigations: {
        create: jest.fn().mockResolvedValue(mockInv),
        findFirst: jest.fn().mockResolvedValue(mockInv),
        findMany: jest.fn().mockResolvedValue([mockInv]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      storage_locations: { findFirst: jest.fn().mockResolvedValue({ location_id: BigInt(1) }) },
      license_plate_numbers: { findMany: jest.fn().mockResolvedValue([]) },
      products: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new CycleCountService(mockPrisma as any, { findAll: jest.fn().mockResolvedValue([]) } as any);
  });

  describe('complete (GAP-2: Inventory Adjustment)', () => {
    it('should auto-adjust inventory for lines within tolerance', async () => {
      jest.spyOn(service as any, 'getSystemQuantity').mockResolvedValue(100);
      await service.complete(tenantId, '1', 'user-1');
      expect(mockPrisma.inventory_on_hand.updateMany).toHaveBeenCalled();
      expect(mockPrisma.inventory_transactions.create).toHaveBeenCalled();
    });

    it('should create investigations for lines exceeding tolerance', async () => {
      jest.spyOn(service as any, 'getSystemQuantity').mockResolvedValue(200); // big variance
      await service.complete(tenantId, '1', 'user-1');
      expect(mockPrisma.variance_investigations.create).toHaveBeenCalled();
    });
  });

  describe('getPendingReviews (GAP-4)', () => {
    it('should return open investigations', async () => {
      const result = await service.getPendingReviews(tenantId, facilityId);
      expect(result).toHaveLength(1);
    });
  });

  describe('approveVariance (GAP-4)', () => {
    it('should adjust inventory and resolve investigation', async () => {
      await service.approveVariance(tenantId, BigInt(1), 'supervisor-1');
      expect(mockPrisma.inventory_on_hand.updateMany).toHaveBeenCalled();
      expect(mockPrisma.variance_investigations.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'RESOLVED' }) }),
      );
    });
  });

  describe('rejectVariance (GAP-4)', () => {
    it('should close investigation', async () => {
      await service.rejectVariance(tenantId, BigInt(1), 'supervisor-1', 'Reason');
      expect(mockPrisma.variance_investigations.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'CLOSED' }) }),
      );
    });
  });

  describe('requestRecount (GAP-4)', () => {
    it('should create new recount count', async () => {
      await service.requestRecount(tenantId, BigInt(1), 'supervisor-1');
      expect(mockPrisma.inventory_counts.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING' }) }),
      );
    });
  });
});
