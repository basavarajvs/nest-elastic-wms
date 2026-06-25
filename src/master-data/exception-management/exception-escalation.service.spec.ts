import { Test, TestingModule } from '@nestjs/testing';
import { ExceptionEscalationService } from './exception-escalation.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  exceptionEscalationRule: {
    count: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  exceptionManagement: {
    findFirst: jest.fn(),
  },
};

describe('ExceptionEscalationService', () => {
  let service: ExceptionEscalationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExceptionEscalationService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(ExceptionEscalationService);
    jest.clearAllMocks();
  });

  const baseRule = {
    facilityId: 'fac-1',
    ruleName: 'High severity escalation',
    exceptionType: 'DAMAGE',
    severityMinimum: 'HIGH',
    unresolvedHours: 2,
    escalateToUserId: 'usr-1',
  };

  describe('createRule', () => {
    it('should create an escalation rule', async () => {
      mockPrisma.exceptionEscalationRule.count.mockResolvedValue(0);
      mockPrisma.exceptionEscalationRule.create.mockResolvedValue({ id: 'rule-1', ...baseRule });

      const result = await service.createRule(baseRule, 't-1');
      expect(mockPrisma.exceptionEscalationRule.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ruleName: 'High severity escalation',
            notifyViaEmail: true,
            isActive: true,
          }),
        }),
      );
      expect(result.id).toBe('rule-1');
    });
  });

  describe('listRules', () => {
    it('should list all rules for a tenant', async () => {
      mockPrisma.exceptionEscalationRule.findMany.mockResolvedValue([{ id: 'rule-1' }]);
      const result = await service.listRules('t-1');
      expect(result).toHaveLength(1);
    });

    it('should filter by facilityId when provided', async () => {
      mockPrisma.exceptionEscalationRule.findMany.mockResolvedValue([{ id: 'rule-1' }]);
      await service.listRules('t-1', 'fac-1');
      expect(mockPrisma.exceptionEscalationRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ facilityId: 'fac-1' }) }),
      );
    });
  });

  describe('checkEscalation', () => {
    it('should return escalation rules matching exception severity and elapsed time', async () => {
      const reportedAt = new Date(Date.now() - 4 * 3600000);
      mockPrisma.exceptionManagement.findFirst.mockResolvedValue({
        id: 'exc-1',
        facilityId: 'fac-1',
        exceptionType: 'DAMAGE',
        severity: 'HIGH',
        reportedAt,
      });
      mockPrisma.exceptionEscalationRule.findMany.mockResolvedValue([
        {
          id: 'rule-1',
          ruleName: 'High severity escalation',
          severityMinimum: 'MEDIUM',
          unresolvedHours: 2,
          escalateToUserId: 'usr-1',
          notifyViaEmail: true,
        },
      ]);

      const result = await service.checkEscalation('exc-1', 't-1');
      expect(result).toHaveLength(1);
      expect(result[0].ruleId).toBe('rule-1');
      expect(result[0].escalateToUserId).toBe('usr-1');
    });

    it('should return empty when exception not found', async () => {
      mockPrisma.exceptionManagement.findFirst.mockResolvedValue(null);
      const result = await service.checkEscalation('bad-id', 't-1');
      expect(result).toHaveLength(0);
    });

    it('should return empty when no rules match severity threshold', async () => {
      const reportedAt = new Date(Date.now() - 4 * 3600000);
      mockPrisma.exceptionManagement.findFirst.mockResolvedValue({
        id: 'exc-1',
        facilityId: 'fac-1',
        exceptionType: 'DAMAGE',
        severity: 'LOW',
        reportedAt,
      });
      mockPrisma.exceptionEscalationRule.findMany.mockResolvedValue([
        {
          id: 'rule-1',
          severityMinimum: 'MEDIUM',
          unresolvedHours: 2,
        },
      ]);

      const result = await service.checkEscalation('exc-1', 't-1');
      expect(result).toHaveLength(0);
    });
  });
});
