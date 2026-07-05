import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InspectionService } from './inspection.service';

describe('InspectionService', () => {
  let service: InspectionService;
  const tenantId = 'test-tenant-uuid';
  const facilityId = BigInt(1);

  const mockLpn = {
    lpn_id: BigInt(1),
    lpn_number: 'LPN-001',
    tenant_id: tenantId,
    facility_id: facilityId,
    location_id: BigInt(1),
    product_id: BigInt(100),
    status: 'IN_QC',
    grn_line_id: BigInt(10),
    created_at: new Date(),
    updated_at: new Date(),
    version: BigInt(0),
  };

  const mockInspection = {
    inspection_id: BigInt(1),
    tenant_id: tenantId,
    facility_id: facilityId,
    inspection_number: 'QC-001',
    reference_type: 'LPN',
    reference_id: BigInt(1),
    product_id: BigInt(100),
    inspection_type: 'STANDARD',
    inspection_scope: 'FULL',
    status: 'PENDING',
    result: null,
    assigned_to_user_id: null,
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
    version: BigInt(0),
  };

  const mockProductMapping = {
    mapping_id: BigInt(1),
    tenant_id: tenantId,
    product_id: BigInt(100),
    profile_id: BigInt(1),
    min_expiry_days: 180,
    is_active: true,
  };

  const mockProfile = {
    profile_id: BigInt(1),
    tenant_id: tenantId,
    profile_name: 'Standard QC',
    is_active: true,
  };

  const mockChecklist = [{
    item_id: BigInt(1),
    profile_id: BigInt(1),
    check_type: 'PACKAGING',
    check_label: 'Check outer packaging',
    is_mandatory: true,
    sort_order: 1,
  }];

  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      license_plate_numbers: {
        findFirst: jest.fn().mockResolvedValue(mockLpn),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      products: { findFirst: jest.fn().mockResolvedValue({ product_id: BigInt(100) }) },
      goods_receipt_items: { findFirst: jest.fn().mockResolvedValue({ receipt_item_id: BigInt(10), receipt_line_id: BigInt(10) }) },
      goods_receipt_lines: { findFirst: jest.fn().mockResolvedValue({ receipt_line_id: BigInt(10), receipt_id: BigInt(1), lot_number: 'LOT-001' }) },
      goods_receipts: { findFirst: jest.fn().mockResolvedValue({ receipt_id: BigInt(1) }) },
      quality_inspections: {
        findUnique: jest.fn().mockResolvedValue(mockInspection),
        findFirst: jest.fn().mockResolvedValue(mockInspection),
        findMany: jest.fn().mockResolvedValue([mockInspection]),
        create: jest.fn().mockResolvedValue(mockInspection),
        update: jest.fn().mockResolvedValue(mockInspection),
      },
      quality_inspection_results: {
        create: jest.fn().mockResolvedValue({ result_id: BigInt(1) }),
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
      quality_inspection_events: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
      },
      quality_holds: { create: jest.fn().mockResolvedValue({}) },
      defect_codes: { findFirst: jest.fn().mockResolvedValue({ severity: 'MAJOR' }) },
      inspection_defects: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
      inspection_temperature_logs: { create: jest.fn().mockResolvedValue({}) },
      product_inspection_profiles: { findFirst: jest.fn().mockResolvedValue(mockProductMapping) },
      inspection_profiles: { findFirst: jest.fn().mockResolvedValue(mockProfile) },
      inspection_checklist_items: { findMany: jest.fn().mockResolvedValue(mockChecklist) },
      putaway_tasks: { create: jest.fn().mockResolvedValue({ task_id: BigInt(1) }) },
      inspection_defects: { findMany: jest.fn().mockResolvedValue([]), createMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    service = new InspectionService(mockPrisma as any);
  });

  describe('lookupLpnForQc', () => {
    it('should return LPN details', async () => {
      const result = await service.lookupLpnForQc(tenantId, facilityId, 'LPN-001');
      expect(result.lpn.lpn_number).toBe('LPN-001');
    });

    it('should throw if LPN not found', async () => {
      mockPrisma.license_plate_numbers.findFirst.mockResolvedValue(null);
      await expect(service.lookupLpnForQc(tenantId, facilityId, 'INVALID')).rejects.toThrow(BadRequestException);
    });

    it('should throw if LPN not in IN_QC status', async () => {
      mockPrisma.license_plate_numbers.findFirst.mockResolvedValue({ ...mockLpn, status: 'STORED' });
      await expect(service.lookupLpnForQc(tenantId, facilityId, 'LPN-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('create', () => {
    it('should create inspection with profile checklist', async () => {
      const result = await service.create(tenantId, { facilityId: '1', productId: '100' });
      expect(result).toBeDefined();
      expect(result.checklist).toBeDefined();
    });
  });

  describe('getNextQcTask', () => {
    it('should assign next pending task', async () => {
      const result = await service.getNextQcTask(tenantId, facilityId, 'user-1');
      expect(result).toBeDefined();
      expect(mockPrisma.quality_inspections.update).toHaveBeenCalled();
    });

    it('should return null if no pending tasks', async () => {
      mockPrisma.quality_inspections.findFirst.mockResolvedValue(null);
      const result = await service.getNextQcTask(tenantId, facilityId, 'user-1');
      expect(result).toBeNull();
    });
  });

  describe('validateLot', () => {
    it('should return match when lots are same', async () => {
      const result = await service.validateLot(tenantId, BigInt(1), 'LOT-001');
      expect(result.match).toBe(true);
    });

    it('should return mismatch when lots differ', async () => {
      const result = await service.validateLot(tenantId, BigInt(1), 'LOT-999');
      expect(result.match).toBe(false);
    });
  });

  describe('validateExpiry', () => {
    it('should return valid for future expiry within threshold', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      const result = await service.validateExpiry(tenantId, BigInt(100), futureDate, facilityId);
      expect(result.valid).toBe(true);
      expect(result.reason).toBe('EXPIRY_VALID');
    });

    it('should return EXPIRY_MISSING for null date', async () => {
      const result = await service.validateExpiry(tenantId, BigInt(100), null as any, facilityId);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('EXPIRY_MISSING');
    });
  });

  describe('recordResult', () => {
    it('should record PASS result and create putaway task', async () => {
      const dto = { resultStatus: 'PASS', productId: '100', inspectorUserId: 'user-1' };
      mockPrisma.quality_inspection_results.count
        .mockResolvedValueOnce(1)  // total
        .mockResolvedValueOnce(1)  // passed
        .mockResolvedValueOnce(0); // failed
      const result = await service.recordResult(tenantId, '1', dto);
      expect(result.overallResult).toBe('PASS');
      expect(mockPrisma.putaway_tasks.create).toHaveBeenCalled();
    });

    it('should flag for supervisor review on critical defect', async () => {
      mockPrisma.quality_inspection_results.count
        .mockResolvedValueOnce(1).mockResolvedValueOnce(1).mockResolvedValueOnce(0);
      mockPrisma.defect_codes.findFirst.mockResolvedValue({ severity: 'CRITICAL' });
      const dto = {
        resultStatus: 'PASS',
        defects: [{ defectCodeId: '1', quantityAffected: 1 }],
      };
      const result = await service.recordResult(tenantId, '1', dto);
      expect(result.requiresSupervisorReview).toBe(true);
    });
  });

  describe('getPendingReviews', () => {
    it('should list inspections awaiting review', async () => {
      const result = await service.getPendingReviews(tenantId, facilityId);
      expect(result).toHaveLength(1);
    });
  });

  describe('supervisorApprove', () => {
    it('should approve and mark completed', async () => {
      mockPrisma.quality_inspections.findUnique.mockResolvedValue({ ...mockInspection, status: 'AWAITING_SUPERVISOR_REVIEW' });
      const result = await service.supervisorApprove(tenantId, BigInt(1), 'supervisor-1');
      expect(result.approved).toBe(true);
    });

    it('should throw if not awaiting review', async () => {
      mockPrisma.quality_inspections.findUnique.mockResolvedValue({ ...mockInspection, status: 'COMPLETED' });
      await expect(service.supervisorApprove(tenantId, BigInt(1), 'supervisor-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('supervisorReject', () => {
    it('should reject and create reinspection', async () => {
      mockPrisma.quality_inspections.findUnique.mockResolvedValue({ ...mockInspection, status: 'AWAITING_SUPERVISOR_REVIEW' });
      mockPrisma.quality_inspections.create.mockResolvedValue({ ...mockInspection, inspection_id: BigInt(2) });
      const result = await service.supervisorReject(tenantId, BigInt(1), 'supervisor-1');
      expect(result.rejected).toBe(true);
      expect(result.newInspectionId).toBeDefined();
      expect(mockPrisma.license_plate_numbers.updateMany).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return inspection with results and defects', async () => {
      const result = await service.findById(tenantId, '1');
      expect(result).toBeDefined();
      expect(result.defects).toBeDefined();
    });
  });
});
