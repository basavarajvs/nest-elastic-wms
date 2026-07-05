import { BadRequestException } from '@nestjs/common';
import { PutawayService } from './putaway.service';

describe('PutawayService', () => {
  let service: PutawayService;
  const tenantId = 'test-tenant-uuid';
  const facilityId = BigInt(1);

  const mockTask = {
    task_id: BigInt(1),
    tenant_id: tenantId,
    facility_id: facilityId,
    task_number: 'PT-001',
    product_id: BigInt(100),
    quantity: 10,
    from_location_id: BigInt(10),
    to_location_id: BigInt(20),
    status: 'ASSIGNED',
    lpn_barcode: 'LPN-001',
    created_at: new Date(),
    updated_at: new Date(),
    version: BigInt(0),
  };

  const mockLpn = {
    lpn_id: BigInt(1),
    lpn_number: 'LPN-001',
    tenant_id: tenantId,
    facility_id: facilityId,
    status: 'PUTAWAY_PENDING',
    product_id: BigInt(100),
    created_at: new Date(),
    updated_at: new Date(),
    version: BigInt(0),
  };

  const mockLocation = {
    location_id: BigInt(20),
    tenant_id: tenantId,
    facility_id: facilityId,
    location_code: 'A-01-01-01',
    location_type: 'PALLET',
    location_tier: 'PRIMARY',
    zone_id: BigInt(1),
    max_weight: 1000,
    max_volume: 100,
    is_active: true,
    is_blocked: false,
    is_reserved: false,
    barcode_value: 'A-01-01-01',
  };

  const mockProduct = {
    product_id: BigInt(100),
    tenant_id: tenantId,
    weight: 2.5,
  };

  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      putaway_tasks: {
        findFirst: jest.fn().mockResolvedValue(mockTask),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      license_plate_numbers: {
        findFirst: jest.fn().mockResolvedValue(mockLpn),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      storage_locations: {
        findFirst: jest.fn().mockResolvedValue(mockLocation),
        findMany: jest.fn().mockResolvedValue([mockLocation]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      putaway_rules: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      inventory_on_hand: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { quantity_on_hand: 0 } }),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      inventory_transactions: {
        create: jest.fn().mockResolvedValue({}),
      },
      location_exceptions: {
        create: jest.fn().mockResolvedValue({ exception_id: BigInt(1) }),
      },
      putaway_damage_records: {
        create: jest.fn().mockResolvedValue({ damage_record_id: BigInt(1) }),
      },
      products: {
        findFirst: jest.fn().mockResolvedValue(mockProduct),
      },
    };
    service = new PutawayService(mockPrisma as any);
  });

  describe('findTaskByLpn (APP-PUT-A)', () => {
    it('should return task for valid LPN', async () => {
      const result = await service.findTaskByLpn(tenantId, facilityId, 'LPN-001');
      expect(result).toBeDefined();
    });

    it('should throw if LPN not found', async () => {
      mockPrisma.license_plate_numbers.findFirst.mockResolvedValue(null);
      await expect(service.findTaskByLpn(tenantId, facilityId, 'INVALID')).rejects.toThrow(BadRequestException);
    });

    it('should throw if LPN not PUTAWAY_PENDING', async () => {
      mockPrisma.license_plate_numbers.findFirst.mockResolvedValue({ ...mockLpn, status: 'STORED' });
      await expect(service.findTaskByLpn(tenantId, facilityId, 'LPN-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('locationFullException (GAP-1)', () => {
    it('should flag location full and return alternate', async () => {
      const result = await service.locationFullException(tenantId, BigInt(1), 'user-1');
      expect(result.locationTier).toBe('OVERFLOW');
      expect(mockPrisma.location_exceptions.create).toHaveBeenCalled();
    });

    it('should throw if no alternate available', async () => {
      mockPrisma.storage_locations.findMany.mockResolvedValue([]);
      await expect(service.locationFullException(tenantId, BigInt(1), 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('reportDamage (GAP-2)', () => {
    it('should record damage and update LPN', async () => {
      const result = await service.reportDamage(tenantId, BigInt(1), { damageQuantity: 5, userId: 'user-1' });
      expect(result).toBeDefined();
      expect(mockPrisma.putaway_damage_records.create).toHaveBeenCalled();
      expect(mockPrisma.license_plate_numbers.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'IN_QC' }) }),
      );
    });
  });

  describe('validateLocation (APP-PUT-H)', () => {
    it('should validate matching location', async () => {
      const result = await service.validateLocation(tenantId, facilityId, BigInt(1), 'A-01-01-01');
      expect(result.valid).toBe(true);
    });

    it('should throw on wrong location', async () => {
      mockPrisma.storage_locations.findFirst
        .mockResolvedValueOnce({ ...mockLocation, location_code: 'WRONG-LOC' })
        .mockResolvedValueOnce(mockLocation); // expected
      await expect(service.validateLocation(tenantId, facilityId, BigInt(1), 'WRONG-LOC')).rejects.toThrow(BadRequestException);
    });
  });
});
