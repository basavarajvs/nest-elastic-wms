import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type Operator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'contains'
  | 'matches'
  | 'between'
  | 'isNull';
type HitPolicy = 'FIRST' | 'ALL' | 'PRIORITY' | 'COLLECT' | 'RULE_ORDER';

interface RuleDefinition {
  id: string;
  tenantId: string;
  ruleKey: string;
  name: string;
  ruleType: string;
  definitionJson: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RuleResult {
  matched: boolean;
  results: any[];
  hitPolicy: HitPolicy;
}

@Injectable()
export class RuleEngineService {
  private readonly logger = new Logger(RuleEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    userId: string,
    dto: any,
  ): Promise<RuleDefinition> {
    const existing = await this.prisma.$queryRawUnsafe<RuleDefinition[]>(
      `SELECT * FROM wms_rules WHERE tenant_id = $1 AND rule_key = $2 AND is_active = true LIMIT 1`,
      tenantId,
      dto.ruleKey,
    );

    if (existing.length > 0) {
      throw new BadRequestException(
        `Rule with key '${dto.ruleKey}' already exists`,
      );
    }

    const result = await this.prisma.$queryRawUnsafe<RuleDefinition[]>(
      `INSERT INTO wms_rules (tenant_id, rule_key, name, rule_type, definition_json, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
       RETURNING *`,
      tenantId,
      dto.ruleKey,
      dto.name,
      dto.ruleType || 'DMN',
      JSON.stringify(dto.definitionJson),
      userId,
      userId,
    );

    return result[0];
  }

  async findAll(tenantId: string, query: any) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const where: string[] = [`tenant_id = $1`];
    const params: any[] = [tenantId];
    let paramIdx = 2;

    if (query.ruleKey) {
      where.push(`rule_key = $${paramIdx++}`);
      params.push(query.ruleKey);
    }
    if (query.ruleType) {
      where.push(`rule_type = $${paramIdx++}`);
      params.push(query.ruleType);
    }
    if (query.isActive !== undefined) {
      where.push(`is_active = $${paramIdx++}`);
      params.push(query.isActive);
    }

    const whereClause = where.join(' AND ');

    const [data, countResult] = await Promise.all([
      this.prisma.$queryRawUnsafe<RuleDefinition[]>(
        `SELECT * FROM wms_rules WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        ...params,
        limit,
        offset,
      ),
      this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*) as count FROM wms_rules WHERE ${whereClause}`,
        ...params,
      ),
    ]);

    const total = Number(countResult[0]?.count || 0);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: string): Promise<RuleDefinition> {
    const result = await this.prisma.$queryRawUnsafe<RuleDefinition[]>(
      `SELECT * FROM wms_rules WHERE tenant_id = $1 AND id = $2`,
      tenantId,
      id,
    );
    if (!result.length)
      throw new NotFoundException('Rule definition not found');
    return result[0];
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: any,
  ): Promise<RuleDefinition> {
    await this.findById(tenantId, id);

    const clause: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (dto.name !== undefined) {
      clause.push(`name = $${idx++}`);
      params.push(dto.name);
    }
    if (dto.definitionJson !== undefined) {
      clause.push(`definition_json = $${idx++}::jsonb`);
      params.push(JSON.stringify(dto.definitionJson));
    }
    if (dto.isActive !== undefined) {
      clause.push(`is_active = $${idx++}`);
      params.push(dto.isActive);
    }
    clause.push(`updated_by = $${idx++}`);
    params.push(userId);
    clause.push(`updated_at = NOW()`);

    params.push(tenantId, id);

    const result = await this.prisma.$queryRawUnsafe<RuleDefinition[]>(
      `UPDATE wms_rules SET ${clause.join(', ')} WHERE tenant_id = $${idx} AND id = $${idx + 1} RETURNING *`,
      ...params,
      tenantId,
      id,
    );

    return result[0];
  }

  async delete(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM wms_rules WHERE tenant_id = $1 AND id = $2`,
      tenantId,
      id,
    );
    return { success: true, message: 'Rule definition deleted' };
  }

  async evaluate(
    tenantId: string,
    ruleKey: string,
    input: Record<string, any>,
  ): Promise<RuleResult> {
    const rules = await this.prisma.$queryRawUnsafe<RuleDefinition[]>(
      `SELECT * FROM wms_rules WHERE tenant_id = $1 AND rule_key = $2 AND is_active = true ORDER BY created_at DESC LIMIT 1`,
      tenantId,
      ruleKey,
    );

    if (!rules.length) {
      throw new NotFoundException(`No active rule found for key: ${ruleKey}`);
    }

    const rule = rules[0];
    const defJson =
      typeof rule.definitionJson === 'string'
        ? JSON.parse(rule.definitionJson)
        : rule.definitionJson;

    const hitPolicy: HitPolicy = defJson.hitPolicy || 'FIRST';
    const rulesArray = defJson.rules || [];

    const results: any[] = [];

    for (const ruleEntry of rulesArray) {
      const matched = this.evaluateConditions(
        ruleEntry.conditions || [],
        input,
      );

      if (matched) {
        const output = this.applyOutput(ruleEntry.output || {}, input);
        results.push({ ruleName: ruleEntry.name, ...output });

        if (hitPolicy === 'FIRST') break;
      }
    }

    if (hitPolicy === 'PRIORITY') {
      results.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }

    if (hitPolicy === 'ALL' || hitPolicy === 'RULE_ORDER') {
      return { matched: results.length > 0, results, hitPolicy };
    }

    if (hitPolicy === 'COLLECT') {
      const collected: Record<string, any> = {};
      for (const r of results) {
        Object.assign(collected, r);
      }
      return { matched: true, results: [collected], hitPolicy };
    }

    return { matched: results.length > 0, results, hitPolicy };
  }

  private evaluateConditions(
    conditions: any[],
    input: Record<string, any>,
  ): boolean {
    if (!conditions.length) return true;

    return conditions.every((condition) => {
      const fieldValue = this.resolveFieldValue(condition.field, input);
      const operator: Operator = condition.operator || 'eq';
      const expectedValue = condition.value;

      return this.applyOperator(operator, fieldValue, expectedValue);
    });
  }

  private resolveFieldValue(field: string, input: Record<string, any>): any {
    const parts = field.split('.');
    let value: any = input;
    for (const part of parts) {
      if (value === null || value === undefined) return undefined;
      value = value[part];
    }
    return value;
  }

  private applyOperator(
    operator: Operator,
    fieldValue: any,
    expectedValue: any,
  ): boolean {
    switch (operator) {
      case 'eq':
        return fieldValue === expectedValue;
      case 'neq':
        return fieldValue !== expectedValue;
      case 'gt':
        return (
          fieldValue != null &&
          expectedValue != null &&
          Number(fieldValue) > Number(expectedValue)
        );
      case 'gte':
        return (
          fieldValue != null &&
          expectedValue != null &&
          Number(fieldValue) >= Number(expectedValue)
        );
      case 'lt':
        return (
          fieldValue != null &&
          expectedValue != null &&
          Number(fieldValue) < Number(expectedValue)
        );
      case 'lte':
        return (
          fieldValue != null &&
          expectedValue != null &&
          Number(fieldValue) <= Number(expectedValue)
        );
      case 'in':
        return (
          Array.isArray(expectedValue) && expectedValue.includes(fieldValue)
        );
      case 'contains':
        return (
          typeof fieldValue === 'string' &&
          typeof expectedValue === 'string' &&
          fieldValue.toLowerCase().includes(expectedValue.toLowerCase())
        );
      case 'matches':
        if (
          typeof fieldValue === 'string' &&
          typeof expectedValue === 'string'
        ) {
          try {
            return new RegExp(expectedValue).test(fieldValue);
          } catch {
            return false;
          }
        }
        return false;
      case 'between':
        return (
          Array.isArray(expectedValue) &&
          expectedValue.length === 2 &&
          fieldValue != null &&
          Number(fieldValue) >= Number(expectedValue[0]) &&
          Number(fieldValue) <= Number(expectedValue[1])
        );
      case 'isNull':
        return fieldValue === null || fieldValue === undefined;
      default:
        return false;
    }
  }

  private applyOutput(
    outputDef: any,
    input: Record<string, any>,
  ): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(outputDef)) {
      if (
        typeof value === 'string' &&
        value.startsWith('{{') &&
        value.endsWith('}}')
      ) {
        const fieldPath = value.slice(2, -2).trim();
        result[key] = this.resolveFieldValue(fieldPath, input);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
}
