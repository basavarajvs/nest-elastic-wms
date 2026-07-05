import { NotFoundException } from '@nestjs/common';
import { InspectionProfileService } from './inspection-profile.service';

describe('InspectionProfileService', () => {
  let service: InspectionProfileService;
  const tenantId = 'test-tenant-uuid';

  const mockProfile = {
    profile_id: BigInt(1),
    tenant_id: tenantId,
    profile_name: 'Pharma QC',
    description: 'Pharmaceutical inspection',
    is_active: true,
    created_by: null,
    updated_by: null,
    created_at: new Date(),
    updated_at: new Date(),
    version: BigInt(0),
  };

  const mockChecklistItem = {
    item_id: BigInt(1),
    profile_id: BigInt(1),
    check_type: 'PACKAGING',
    check_label: 'Check packaging',
    is_mandatory: true,
    sort_order: 1,
    acceptable_criteria: null,
    created_at: new Date(),
    updated_at: new Date(),
    version: BigInt(0),
  };

  const mockMapping = {
    mapping_id: BigInt(1),
    tenant_id: tenantId,
    product_id: BigInt(100),
    profile_id: BigInt(1),
    vendor_id: null,
    client_id: null,
    min_expiry_days: 365,
    temperature_min: null,
    temperature_max: null,
    sampling_percentage: null,
    sampling_method: '100_PERCENT',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    version: BigInt(0),
  };

  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      inspection_profiles: {
        create: jest.fn().mockResolvedValue(mockProfile),
        findFirst: jest.fn().mockResolvedValue(mockProfile),
        findMany: jest.fn().mockResolvedValue([mockProfile]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      inspection_checklist_items: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([mockChecklistItem]),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      product_inspection_profiles: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(mockMapping),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    service = new InspectionProfileService(mockPrisma as any);
  });

  it('create should create profile', async () => {
    const result = await service.create(tenantId, { profileName: 'Pharma QC' });
    expect(result).toBeDefined();
  });

  it('create with checklist should create both', async () => {
    const result = await service.create(tenantId, {
      profileName: 'QC',
      checklistItems: [{ checkType: 'PACKAGING', checkLabel: 'Check', isMandatory: true, sortOrder: 1 }],
    });
    expect(mockPrisma.inspection_checklist_items.createMany).toHaveBeenCalled();
  });

  it('findAll should list profiles', async () => {
    const result = await service.findAll(tenantId);
    expect(result).toHaveLength(1);
  });

  it('findById should return profile with checklist', async () => {
    const result = await service.findById(tenantId, BigInt(1));
    expect(result.checklist).toBeDefined();
  });

  it('findById should throw on missing', async () => {
    mockPrisma.inspection_profiles.findFirst.mockResolvedValue(null);
    await expect(service.findById(tenantId, BigInt(999))).rejects.toThrow(NotFoundException);
  });

  it('assignToProduct should create mapping', async () => {
    const result = await service.assignToProduct(tenantId, { productId: '100', profileId: '1', minExpiryDays: 365 });
    expect(mockPrisma.product_inspection_profiles.create).toHaveBeenCalled();
  });

  it('assignToProduct should update existing mapping', async () => {
    mockPrisma.inspection_profiles.findFirst.mockResolvedValue(mockProfile);
    mockPrisma.product_inspection_profiles.findFirst.mockResolvedValue(mockMapping);
    const result = await service.assignToProduct(tenantId, { productId: '100', profileId: '1', minExpiryDays: 180 });
    expect(mockPrisma.product_inspection_profiles.updateMany).toHaveBeenCalled();
  });

  it('getProfileForProduct should return null when no mapping', async () => {
    mockPrisma.inspection_profiles.findFirst.mockResolvedValue(mockProfile);
    mockPrisma.product_inspection_profiles.findFirst.mockResolvedValue(null);
    const result = await service.getProfileForProduct(tenantId, BigInt(999));
    expect(result).toBeNull();
  });

  it('delete should remove profile and checklists', async () => {
    mockPrisma.inspection_profiles.findFirst.mockResolvedValue(mockProfile);
    await service.delete(tenantId, BigInt(1));
    expect(mockPrisma.inspection_checklist_items.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.inspection_profiles.deleteMany).toHaveBeenCalled();
  });
});
