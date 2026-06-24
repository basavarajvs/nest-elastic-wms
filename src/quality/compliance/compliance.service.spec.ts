import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceService } from './compliance.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  complianceRequirement: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  complianceAudit: {
    count: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  hazmatMaterial: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('ComplianceService', () => {
  let service: ComplianceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplianceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ComplianceService);
    jest.clearAllMocks();
  });

  describe('createRequirement', () => {
    const dto = {
      facilityId: 'fac-1',
      complianceType: 'FDA',
      requirementCode: 'FDA-21-CFR-110',
      description: 'Current Good Manufacturing Practice',
      applicableEntity: 'PRODUCT',
      frequencyType: 'ANNUAL',
    };

    it('should create a compliance requirement', async () => {
      mockPrisma.complianceRequirement.create.mockResolvedValue({ id: 'r-1', ...dto, tenantId: 't-1' });

      const result = await service.createRequirement(dto, 't-1');

      expect(mockPrisma.complianceRequirement.create).toHaveBeenCalledWith({
        data: { ...dto, tenantId: 't-1' },
      });
      expect(result.id).toBe('r-1');
    });
  });

  describe('listRequirements', () => {
    it('should filter by facility and compliance type', async () => {
      mockPrisma.complianceRequirement.findMany.mockResolvedValue([{ id: 'r-1', requirementCode: 'FDA-110' }]);

      const result = await service.listRequirements('t-1', { facilityId: 'fac1', complianceType: 'FDA' });

      expect(mockPrisma.complianceRequirement.findMany).toHaveBeenCalledWith({
        where: { tenantId: 't-1', facilityId: 'fac1', complianceType: 'FDA' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('createAudit', () => {
    it('should create audit with auto-generated number', async () => {
      mockPrisma.complianceRequirement.findFirst.mockResolvedValue({ id: 'req-1' });
      mockPrisma.complianceAudit.count.mockResolvedValue(0);
      mockPrisma.complianceAudit.create.mockResolvedValue({ id: 'aud-1', auditNumber: 'AUD-FAC1-000001' });

      const result = await service.createAudit('t-1', 'fac1', 'req-1', '2026-07-01', 'u-1');

      expect(mockPrisma.complianceAudit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 't-1',
      facilityId: 'fac1',
            requirementId: 'req-1',
            auditNumber: 'AUD-FAC1-000001',
            status: 'SCHEDULED',
          }),
        }),
      );
      expect(result.auditNumber).toBe('AUD-FAC1-000001');
    });

    it('should throw when requirement not found', async () => {
      mockPrisma.complianceRequirement.findFirst.mockResolvedValue(null);
      await expect(service.createAudit('t-1', 'fac1', 'bad-req')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateAudit', () => {
    it('should update status, result and set completedAt', async () => {
      mockPrisma.complianceAudit.findFirst.mockResolvedValue({ id: 'aud-1', tenantId: 't-1' });
      mockPrisma.complianceAudit.update.mockResolvedValue({ id: 'aud-1', status: 'PASSED', result: 'PASS', completedAt: new Date() });

      const result = await service.updateAudit('aud-1', { status: 'PASSED', result: 'PASS', findings: { ok: true } }, 't-1');

      expect(mockPrisma.complianceAudit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'aud-1' },
          data: expect.objectContaining({ status: 'PASSED', result: 'PASS', completedAt: expect.any(Date) }),
        }),
      );
      expect(result.status).toBe('PASSED');
    });
  });

  describe('registerHazmat', () => {
    const dto = {
      facilityId: 'fac-1',
      productId: 'prod-1',
      hazardClass: '3',
      unNumber: 'UN1203',
      properShippingName: 'Gasoline',
      packingGroup: 'II',
    };

    it('should create a hazmat material record', async () => {
      mockPrisma.hazmatMaterial.create.mockResolvedValue({ id: 'haz-1', ...dto, tenantId: 't-1' });

      const result = await service.registerHazmat(dto, 't-1');

      expect(mockPrisma.hazmatMaterial.create).toHaveBeenCalledWith({
        data: { ...dto, tenantId: 't-1' },
      });
      expect(result.id).toBe('haz-1');
    });
  });

  describe('listHazmat', () => {
    it('should filter by facility and hazard class', async () => {
      mockPrisma.hazmatMaterial.findMany.mockResolvedValue([{ id: 'haz-1', hazardClass: '3' }]);
      const result = await service.listHazmat('t-1', { facilityId: 'fac1', hazardClass: '3' });
      expect(mockPrisma.hazmatMaterial.findMany).toHaveBeenCalledWith({
        where: { tenantId: 't-1', facilityId: 'fac1', hazardClass: '3' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });
});
