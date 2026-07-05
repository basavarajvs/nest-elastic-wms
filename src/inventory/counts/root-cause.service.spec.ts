import { NotFoundException } from '@nestjs/common';
import { RootCauseService } from './root-cause.service';

describe('RootCauseService', () => {
  let service: RootCauseService;
  const tenantId = 'test-tenant-uuid';

  const mockCategory = {
    category_id: BigInt(1),
    tenant_id: tenantId,
    code: 'PICKING_ERROR',
    description: 'Picking Error',
    category_type: 'PICKING_ERROR',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    version: BigInt(0),
  };

  const mockInv = {
    investigation_id: BigInt(1),
    tenant_id: tenantId,
    status: 'OPEN',
  };

  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      root_cause_categories: {
        create: jest.fn().mockResolvedValue(mockCategory),
        findMany: jest.fn().mockResolvedValue([mockCategory]),
      },
      variance_investigations: {
        findFirst: jest.fn().mockResolvedValue(mockInv),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    service = new RootCauseService(mockPrisma as any);
  });

  it('createCategory should create a root cause category', async () => {
    const result = await service.createCategory(tenantId, { code: 'TEST', description: 'Test', categoryType: 'OTHER' });
    expect(mockPrisma.root_cause_categories.create).toHaveBeenCalled();
  });

  it('findAllCategories should list categories', async () => {
    const result = await service.findAllCategories(tenantId);
    expect(result).toHaveLength(1);
  });

  it('assignRootCause should assign root cause', async () => {
    await service.assignRootCause(tenantId, BigInt(1), BigInt(1), 'Test description');
    expect(mockPrisma.variance_investigations.updateMany).toHaveBeenCalled();
  });

  it('assignRootCause should throw if investigation not found', async () => {
    mockPrisma.variance_investigations.findFirst.mockResolvedValue(null);
    await expect(service.assignRootCause(tenantId, BigInt(999), BigInt(1))).rejects.toThrow(NotFoundException);
  });
});
