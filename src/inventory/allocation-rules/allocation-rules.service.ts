import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateAllocationRuleDto,
  UpdateAllocationRuleDto,
  CreateConstraintDto,
  CreateRuleLocationDto,
  EvaluateRulesDto,
} from './dtos/allocation-rule.dto';

@Injectable()
export class AllocationRulesService {
  private readonly logger = new Logger(AllocationRulesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAllocationRuleDto, tenantId: string) {
    const existing = await (this.prisma as any).inventoryAllocationRule.findFirst({
      where: { tenantId, facilityId: dto.facilityId, ruleName: dto.ruleName },
    });
    if (existing) throw new BadRequestException(`Rule "${dto.ruleName}" already exists in this facility`);

    return (this.prisma as any).inventoryAllocationRule.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        ruleName: dto.ruleName,
        ruleType: dto.ruleType,
        priority: dto.priority ?? 100,
        isActive: dto.isActive ?? true,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : new Date(),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        description: dto.description,
      },
      include: { constraints: true, locations: true },
    });
  }

  async findAll(tenantId: string, facilityId?: string, isActive?: boolean) {
    const where: any = { tenantId };
    if (facilityId) where.facilityId = facilityId;
    if (isActive !== undefined) where.isActive = isActive;
    return (this.prisma as any).inventoryAllocationRule.findMany({
      where,
      include: { _count: { select: { constraints: true, locations: true } } },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findById(id: string, tenantId: string) {
    const rule = await (this.prisma as any).inventoryAllocationRule.findFirst({
      where: { id, tenantId },
      include: { constraints: true, locations: true },
    });
    if (!rule) throw new NotFoundException('Allocation rule not found');
    return rule;
  }

  async update(id: string, tenantId: string, dto: UpdateAllocationRuleDto) {
    const rule = await (this.prisma as any).inventoryAllocationRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Allocation rule not found');
    const data: any = {};
    if (dto.ruleName !== undefined) data.ruleName = dto.ruleName;
    if (dto.ruleType !== undefined) data.ruleType = dto.ruleType;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.effectiveDate !== undefined) data.effectiveDate = new Date(dto.effectiveDate);
    if (dto.expiryDate !== undefined) data.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
    if (dto.description !== undefined) data.description = dto.description;
    return (this.prisma as any).inventoryAllocationRule.update({
      where: { id },
      data,
      include: { constraints: true, locations: true },
    });
  }

  async delete(id: string, tenantId: string) {
    const rule = await (this.prisma as any).inventoryAllocationRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Allocation rule not found');
    await (this.prisma as any).inventoryAllocationRule.delete({ where: { id } });
    return { success: true };
  }

  async addConstraint(ruleId: string, tenantId: string, dto: CreateConstraintDto) {
    const rule = await (this.prisma as any).inventoryAllocationRule.findFirst({ where: { id: ruleId, tenantId } });
    if (!rule) throw new NotFoundException('Allocation rule not found');
    return (this.prisma as any).inventoryAllocationRuleConstraint.create({
      data: {
        tenantId,
        ruleId,
        constraintField: dto.constraintField,
        constraintOperator: dto.constraintOperator,
        constraintValue: dto.constraintValue,
      },
    });
  }

  async removeConstraint(ruleId: string, constraintId: string, tenantId: string) {
    const constraint = await (this.prisma as any).inventoryAllocationRuleConstraint.findFirst({
      where: { id: constraintId, ruleId, tenantId },
    });
    if (!constraint) throw new NotFoundException('Constraint not found');
    await (this.prisma as any).inventoryAllocationRuleConstraint.delete({ where: { id: constraintId } });
    return { success: true };
  }

  async addLocation(ruleId: string, tenantId: string, dto: CreateRuleLocationDto) {
    const rule = await (this.prisma as any).inventoryAllocationRule.findFirst({ where: { id: ruleId, tenantId } });
    if (!rule) throw new NotFoundException('Allocation rule not found');
    return (this.prisma as any).inventoryAllocationRuleLocation.create({
      data: { tenantId, ruleId, locationId: dto.locationId, priority: dto.priority ?? 100 },
    });
  }

  async removeLocation(ruleId: string, locationRecId: string, tenantId: string) {
    const loc = await (this.prisma as any).inventoryAllocationRuleLocation.findFirst({
      where: { id: locationRecId, ruleId, tenantId },
    });
    if (!loc) throw new NotFoundException('Location override not found');
    await (this.prisma as any).inventoryAllocationRuleLocation.delete({ where: { id: locationRecId } });
    return { success: true };
  }

  async evaluate(dto: EvaluateRulesDto, tenantId: string) {
    const now = new Date();
    const rules = await (this.prisma as any).inventoryAllocationRule.findMany({
      where: {
        tenantId,
        facilityId: dto.facilityId,
        isActive: true,
        effectiveDate: { lte: now },
        OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
      },
      include: { constraints: true, locations: true },
      orderBy: { priority: 'asc' },
    });

    const matched: any[] = [];
    for (const rule of rules) {
      if (rule.constraints.length > 0) {
        const passes = rule.constraints.every((c: any) =>
          this.evaluateConstraint(c, dto),
        );
        if (!passes) continue;
      }

      const locationIds = rule.locations
        .sort((a: any, b: any) => a.priority - b.priority)
        .map((l: any) => l.locationId);

      matched.push({
        ruleId: rule.id,
        ruleName: rule.ruleName,
        ruleType: rule.ruleType,
        priority: rule.priority,
        locationIds,
      });
    }

    return {
      productId: dto.productId,
      facilityId: dto.facilityId,
      matchedRules: matched,
      recommendedStrategy: matched.length > 0 ? matched[0].ruleType : 'FIFO',
    };
  }

  private evaluateConstraint(constraint: any, context: EvaluateRulesDto): boolean {
    const fieldValue = (context as any)[constraint.constraintField];
    if (fieldValue === undefined) return false;

    switch (constraint.constraintOperator) {
      case 'EQUALS':
        return String(fieldValue) === constraint.constraintValue;
      case 'IN': {
        const values = constraint.constraintValue.split(',').map((v: string) => v.trim());
        return values.includes(String(fieldValue));
      }
      case 'NOT_IN': {
        const values = constraint.constraintValue.split(',').map((v: string) => v.trim());
        return !values.includes(String(fieldValue));
      }
      case 'MIN':
        return Number(fieldValue) >= Number(constraint.constraintValue);
      case 'MAX':
        return Number(fieldValue) <= Number(constraint.constraintValue);
      default:
        return false;
    }
  }
}
