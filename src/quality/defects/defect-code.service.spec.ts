import { NotFoundException } from '@nestjs/common';
import { DefectCodeService } from './defect-code.service';

describe('DefectCodeService', () => {
  let service: DefectCodeService;
  const tenantId = 'test-tenant-uuid';

  const mockDefectCode = {
    defect_code_id: BigInt(1),
    tenant_id: tenantId,
    code: 'BROKEN_SEAL',
    description: 'Broken Seal',
    category: 'PACKAGING',
    severity: 'MAJOR',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    version: BigInt(0),
  };

  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      defect_codes: {
        create: jest.fn().mockResolvedValue(mockDefectCode),
        findFirst: jest.fn().mockResolvedValue(mockDefectCode),
        findMany: jest.fn().mockResolvedValue([mockDefectCode]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    service = new DefectCodeService(mockPrisma as any);
  });

  it('create should create defect code', async () => {
    const result = await service.create(tenantId, { code: 'TEST', description: 'Test', category: 'PACKAGING', severity: 'MINOR' });
    expect(result.code).toBe('BROKEN_SEAL');
  });

  it('findAll should list codes', async () => {
    const result = await service.findAll(tenantId, {});
    expect(result).toHaveLength(1);
  });

  it('findById should return code', async () => {
    const result = await service.findById(tenantId, BigInt(1));
    expect(result).toBeDefined();
  });

  it('findById should throw on missing', async () => {
    mockPrisma.defect_codes.findFirst.mockResolvedValue(null);
    await expect(service.findById(tenantId, BigInt(999))).rejects.toThrow(NotFoundException);
  });

  it('seedDefaults should seed all 10', async () => {
    mockPrisma.defect_codes.findFirst.mockResolvedValue(null);
    const result = await service.seedDefaults(tenantId);
    expect(result.seeded).toBe(10);
  });
});
