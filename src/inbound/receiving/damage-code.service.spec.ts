import { NotFoundException } from '@nestjs/common';
import { DamageCodeService } from './damage-code.service';

describe('DamageCodeService', () => {
  let service: DamageCodeService;
  const tenantId = 'test-tenant-uuid';

  const mockDamageCode = {
    damage_code_id: BigInt(1),
    tenant_id: tenantId,
    code: 'CRUSHED_PALLET',
    description: 'Crushed Pallet',
    category: 'TRANSPORT',
    requires_qc: false,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    version: BigInt(0),
  };

  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      damage_codes: {
        create: jest.fn().mockResolvedValue(mockDamageCode),
        findFirst: jest.fn().mockResolvedValue(mockDamageCode),
        findMany: jest.fn().mockResolvedValue([mockDamageCode, { ...mockDamageCode, code: 'WATER_DAMAGE' }]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    service = new DamageCodeService(mockPrisma as any);
  });

  it('create should create a damage code', async () => {
    const result = await service.create(tenantId, { damage_code: 'TEST', description: 'Test code' });
    expect(result.code).toBe('CRUSHED_PALLET');
  });

  it('findAll should list codes', async () => {
    const result = await service.findAll(tenantId, {});
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('findById should return code', async () => {
    const result = await service.findById(tenantId, BigInt(1));
    expect(result).toBeDefined();
  });

  it('findById should throw on missing', async () => {
    mockPrisma.damage_codes.findFirst.mockResolvedValue(null);
    await expect(service.findById(tenantId, BigInt(999))).rejects.toThrow(NotFoundException);
  });

  it('update should update code', async () => {
    const result = await service.update(tenantId, BigInt(1), { description: 'Updated' });
    expect(result.code).toBe('CRUSHED_PALLET');
  });

  it('delete should delete code', async () => {
    const result = await service.delete(tenantId, BigInt(1));
    expect(result.code).toBe('CRUSHED_PALLET');
  });

  it('seedDefaults should seed when empty', async () => {
    mockPrisma.damage_codes.findFirst.mockResolvedValue(null);
    const result = await service.seedDefaults(tenantId);
    expect(result.seeded).toBe(7);
  });

  it('seedDefaults should skip existing', async () => {
    const result = await service.seedDefaults(tenantId);
    expect(result.seeded).toBe(0);
  });
});
