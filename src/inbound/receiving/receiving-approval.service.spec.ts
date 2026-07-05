import { NotFoundException } from '@nestjs/common';
import { ReceivingApprovalService } from './receiving-approval.service';

describe('ReceivingApprovalService', () => {
  let service: ReceivingApprovalService;
  const tenantId = 'test-tenant-uuid';
  const facilityId = BigInt(1);

  const mockConfig = {
    config_id: BigInt(1),
    tenant_id: tenantId,
    facility_id: facilityId,
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
        create: jest.fn().mockResolvedValue(mockConfig),
        findFirst: jest.fn().mockResolvedValue(mockConfig),
        findMany: jest.fn().mockResolvedValue([mockConfig]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    service = new ReceivingApprovalService(mockPrisma as any);
  });

  it('createApproval should create config', async () => {
    const dto = { facilityId: '1', overTolerance: 10, underTolerance: 10 };
    const result = await service.createApproval(tenantId, dto);
    expect(mockPrisma.receiving_tolerance_configs.create).toHaveBeenCalled();
  });

  it('getPendingApprovals should list pending', async () => {
    const result = await service.getPendingApprovals(tenantId, facilityId);
    expect(result).toHaveLength(1);
  });

  it('approve should set requires_supervisor_approval to false', async () => {
    await service.approve(tenantId, BigInt(1), 'supervisor-1');
    expect(mockPrisma.receiving_tolerance_configs.updateMany).toHaveBeenCalled();
  });

  it('approve should throw on missing config', async () => {
    mockPrisma.receiving_tolerance_configs.findFirst.mockResolvedValue(null);
    await expect(service.approve(tenantId, BigInt(999), 'supervisor-1')).rejects.toThrow(NotFoundException);
  });

  it('reject should deactivate config', async () => {
    await service.reject(tenantId, BigInt(1), 'supervisor-1');
    expect(mockPrisma.receiving_tolerance_configs.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ is_active: false }) }),
    );
  });
});
