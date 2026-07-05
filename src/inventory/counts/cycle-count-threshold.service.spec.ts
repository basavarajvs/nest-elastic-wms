import { CycleCountThresholdService } from './cycle-count-threshold.service';

describe('CycleCountThresholdService', () => {
  let service: CycleCountThresholdService;
  const tenantId = 'test-tenant-uuid';
  const facilityId = BigInt(1);

  const mockConfig = {
    config_id: BigInt(1),
    tenant_id: tenantId,
    facility_id: facilityId,
    threshold_type: 'PERCENTAGE',
    auto_approve_pct: 2,
    supervisor_review_pct: 10,
    recount_pct: 20,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    version: BigInt(0),
  };

  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      approval_threshold_configs: {
        findFirst: jest.fn().mockResolvedValue(mockConfig),
        create: jest.fn().mockResolvedValue(mockConfig),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([mockConfig]),
      },
    };
    service = new CycleCountThresholdService(mockPrisma as any);
  });

  it('getThresholdForFacility should return config', async () => {
    const result = await service.getThresholdForFacility(tenantId, facilityId);
    expect(result).toBeDefined();
  });

  it('evaluateVariance should return AUTO_APPROVE for small variance', async () => {
    const result = await service.evaluateVariance(tenantId, facilityId, 100, 101);
    expect(result.action).toBe('AUTO_APPROVE');
  });

  it('evaluateVariance should return SUPERVISOR_REVIEW for medium variance', async () => {
    const result = await service.evaluateVariance(tenantId, facilityId, 100, 108);
    expect(result.action).toBe('SUPERVISOR_REVIEW');
  });

  it('evaluateVariance should return RECOUNT for large variance', async () => {
    const result = await service.evaluateVariance(tenantId, facilityId, 100, 130);
    expect(result.action).toBe('RECOUNT');
  });

  it('evaluateVariance should handle missing config', async () => {
    mockPrisma.approval_threshold_configs.findFirst.mockResolvedValue(null);
    const result = await service.evaluateVariance(tenantId, facilityId, 100, 90);
    expect(result.action).toBe('SUPERVISOR_REVIEW');
  });

  it('upsert should create new config when none exists', async () => {
    mockPrisma.approval_threshold_configs.findFirst.mockResolvedValue(null);
    await service.upsert(tenantId, { facilityId: '1', autoApprovePct: 5 });
    expect(mockPrisma.approval_threshold_configs.create).toHaveBeenCalled();
  });

  it('upsert should update existing config', async () => {
    await service.upsert(tenantId, { facilityId: '1', autoApprovePct: 3 });
    expect(mockPrisma.approval_threshold_configs.updateMany).toHaveBeenCalled();
  });

  it('findAll should list configs', async () => {
    const result = await service.findAll(tenantId, facilityId);
    expect(result).toHaveLength(1);
  });
});
