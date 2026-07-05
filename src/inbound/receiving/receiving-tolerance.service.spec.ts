import { ReceivingToleranceService } from './receiving-tolerance.service';

describe('ReceivingToleranceService', () => {
  let service: ReceivingToleranceService;
  const tenantId = 'test-tenant-uuid';
  const facilityId = BigInt(1);

  const mockConfig = {
    config_id: BigInt(1),
    tenant_id: tenantId,
    facility_id: facilityId,
    product_id: null,
    vendor_id: null,
    tolerance_type: 'PERCENTAGE',
    over_tolerance: 10,
    under_tolerance: 10,
    requires_supervisor_approval: true,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    version: BigInt(0),
  };

  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      receiving_tolerance_configs: {
        findFirst: jest.fn().mockResolvedValue(mockConfig),
        create: jest.fn().mockResolvedValue(mockConfig),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([mockConfig]),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    service = new ReceivingToleranceService(mockPrisma as any);
  });

  it('getToleranceConfig should find config', async () => {
    const result = await service.getToleranceConfig(tenantId, facilityId);
    expect(result).toBeDefined();
  });

  it('isWithinTolerance should detect NONE', async () => {
    const result = await service.isWithinTolerance(tenantId, facilityId, 100, 100);
    expect(result.within).toBe(true);
    expect(result.variance).toBe('NONE');
  });

  it('isWithinTolerance should detect OVER within tolerance', async () => {
    const result = await service.isWithinTolerance(tenantId, facilityId, 100, 105);
    expect(result.within).toBe(true);
    expect(result.variance).toBe('OVER');
  });

  it('isWithinTolerance should detect OVER requiring supervisor', async () => {
    const result = await service.isWithinTolerance(tenantId, facilityId, 100, 120);
    expect(result.within).toBe(false);
    expect(result.requiresSupervisor).toBe(true);
  });

  it('isWithinTolerance should handle null config', async () => {
    mockPrisma.receiving_tolerance_configs.findFirst.mockResolvedValue(null);
    const result = await service.isWithinTolerance(tenantId, facilityId, 100, 200);
    expect(result.within).toBe(true);
  });

  it('upsert should create new config', async () => {
    mockPrisma.receiving_tolerance_configs.findFirst.mockResolvedValue(null);
    const result = await service.upsert(tenantId, { facilityId: '1', overTolerance: 10 });
    expect(mockPrisma.receiving_tolerance_configs.create).toHaveBeenCalled();
  });

  it('upsert should update existing config', async () => {
    const result = await service.upsert(tenantId, { facilityId: '1', overTolerance: 5 });
    expect(mockPrisma.receiving_tolerance_configs.updateMany).toHaveBeenCalled();
  });

  it('findAll should list configs', async () => {
    const result = await service.findAll(tenantId, facilityId);
    expect(result).toHaveLength(1);
  });
});
