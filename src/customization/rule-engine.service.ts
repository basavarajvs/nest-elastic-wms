import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';

const CACHE_TTL = 300;
const IDENTICAL_INPUT_CACHE_TTL = 60;
const CACHE_PREFIX = 'wms:rule:';

interface ContextResolverInput {
  inputData: Record<string, any>;
  contextKeys: string[];
  tenantId: string;
}

interface JdmCondition {
  field: string;
  operator: string;
  value: any;
}

interface JdmRule {
  conditions?: JdmCondition[];
  output?: Record<string, any>;
  priority?: number;
  when?: JdmCondition[];
  then?: Record<string, any>;
  result?: Record<string, any>;
}

interface JdmDecisionTable {
  hitPolicy?: string;
  aggregation?: string;
  rules: JdmRule[];
  defaultOutput?: Record<string, any>;
}

interface JdmDefinition {
  decisionTable?: JdmDecisionTable;
  rules?: JdmRule[];
  defaultOutput?: Record<string, any>;
}

type ZenEngineInstance = any;
type ZenDecision = any;

@Injectable()
export class RuleEngineService {
  private readonly logger = new Logger(RuleEngineService.name);
  private zenEngine: ZenEngineInstance | null = null;
  private decisionCache = new Map<string, ZenDecision>();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    this.initZenEngine();
  }

  private initZenEngine() {
    try {
      const { ZenEngine } = require('@gorules/zen-engine');
      this.zenEngine = new ZenEngine();
    } catch (err: any) {
      this.logger.warn(`@gorules/zen-engine not available, using fallback engine: ${err.message}`);
    }
  }

  async upsertRule(dto: { ruleKey: string; ruleType: string; definitionJson: any }, tenantId: string) {
    this.validateDefinition(dto.definitionJson);

    const existing = await (this.prisma as any).wmsRule.findFirst({
      where: { tenantId, ruleKey: dto.ruleKey, isActive: true },
      orderBy: { version: 'desc' },
    });

    const newVersion = existing ? existing.version + 1 : 1;

    return (this.prisma as any).$transaction(async (tx: any) => {
      if (existing) {
        await tx.wmsRule.updateMany({
          where: { tenantId, ruleKey: dto.ruleKey, isActive: true },
          data: { isActive: false },
        });
      }

      const rule = await tx.wmsRule.create({
        data: {
          tenantId,
          ruleKey: dto.ruleKey,
          ruleType: dto.ruleType,
          version: newVersion,
          definitionJson: dto.definitionJson,
          isActive: true,
        },
      });

      this.decisionCache.delete(`${tenantId}:${dto.ruleKey}`);
      await this.redis.del(`${CACHE_PREFIX}${tenantId}:${dto.ruleKey}`);
      return rule;
    });
  }

  async getDefinition(ruleKey: string, tenantId: string) {
    const cacheKey = `${CACHE_PREFIX}${tenantId}:${ruleKey}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const rule = await (this.prisma as any).wmsRule.findFirst({
      where: { tenantId, ruleKey, isActive: true },
      orderBy: { version: 'desc' },
    });
    if (!rule) throw new BadRequestException(`Rule '${ruleKey}' not found`);

    await this.redis.setex(cacheKey, CACHE_TTL, JSON.stringify(rule));
    return rule;
  }

  async evaluateRule(
    ruleKey: string,
    inputData: Record<string, any>,
    tenantId: string,
    contextKeys?: string[],
  ) {
    const inputHash = this.hashInput(inputData);
    const inputCacheKey = `${CACHE_PREFIX}${tenantId}:${ruleKey}:input:${inputHash}`;
    const cachedResult = await this.redis.get(inputCacheKey);
    if (cachedResult) return JSON.parse(cachedResult);

    const rule = await this.getDefinition(ruleKey, tenantId);

    const resolvedContext = await this.resolveContext({ inputData, contextKeys: contextKeys || [], tenantId });
    const enrichedInput = { ...inputData, ...resolvedContext };

    let output: any;
    try {
      if (this.zenEngine && this.isZenGraphFormat(rule.definitionJson)) {
        output = await this.evaluateWithZenEngine(rule.definitionJson, enrichedInput);
      } else {
        output = this.evaluateWithJdmEngine(rule.definitionJson, enrichedInput);
      }
    } catch (err: any) {
      throw new BadRequestException(`RuleEvaluationFailed: ${err.message}`);
    }

    await this.redis.setex(inputCacheKey, IDENTICAL_INPUT_CACHE_TTL, JSON.stringify(output));
    return this.extractOutput(output);
  }

  private isZenGraphFormat(definition: any): boolean {
    return definition?.nodes && Array.isArray(definition.nodes) && definition.nodes.length > 0;
  }

  private async getOrCreateDecision(definition: any): Promise<ZenDecision> {
    const key = JSON.stringify(definition);
    const cached = this.decisionCache.get(key);
    if (cached) return cached;

    const content = typeof definition === 'string' ? JSON.parse(definition) : definition;
    const decision = await this.zenEngine!.createDecision(content);
    this.decisionCache.set(key, decision);
    return decision;
  }

  private async evaluateWithZenEngine(definition: any, input: Record<string, any>): Promise<any> {
    const decision = await this.getOrCreateDecision(definition);
    const result = await decision.evaluate(input);
    return result;
  }

  private evaluateWithJdmEngine(definition: any, input: Record<string, any>): any {
    const def = this.normalizeDefinition(definition);
    const engine = this.createJdmEngine(def);
    return engine.evaluate(input);
  }

  private normalizeDefinition(raw: any): JdmDefinition {
    if (raw.nodes) {
      return this.convertGraphToJdm(raw);
    }
    return raw as JdmDefinition;
  }

  private convertGraphToJdm(graph: any): JdmDefinition {
    const tableNode = graph.nodes?.find((n: any) => n.type === 'decisionTableNode');
    if (!tableNode) {
      return { defaultOutput: {} };
    }

    const content = tableNode.content || {};

    const inputs = content.inputs || [];
    const outputs = content.outputs || [];
    const rules: JdmRule[] = [];

    for (const row of content.rules || []) {
      const conditions: JdmCondition[] = [];
      for (const inp of inputs) {
        const cellValue = row[inp.id];
        if (cellValue === undefined || cellValue === null || cellValue === '') continue;

        const parsed = this.parseUnaryExpression(cellValue);
        conditions.push({
          field: inp.field || inp.name || 'input',
          operator: parsed.operator,
          value: parsed.value,
        });
      }

      const output: Record<string, any> = {};
      for (const outp of outputs) {
        const cellValue = row[outp.id];
        if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
          output[outp.field || outp.name || 'output'] = this.coerceOutput(cellValue);
        }
      }

      rules.push({ conditions, output, priority: row.priority || 0 });
    }

    return {
      decisionTable: {
        hitPolicy: (content.hitPolicy || 'first').toUpperCase() as any,
        rules,
        defaultOutput: {},
      },
    };
  }

  private parseUnaryExpression(expr: string): { operator: string; value: any } {
    const trimmed = String(expr).trim();

    if (trimmed === 'true') return { operator: 'eq', value: true };
    if (trimmed === 'false') return { operator: 'eq', value: false };
    if (trimmed === 'null' || trimmed === '-') return { operator: 'isNull', value: null };
    if (trimmed === '' || trimmed === 'any') return { operator: 'notNull', value: null };

    const rangeMatch = trimmed.match(/^\[(\d+(?:\.\d+)?)\.\.(\d+(?:\.\d+)?)\]$/);
    if (rangeMatch) {
      return { operator: 'between', value: [Number(rangeMatch[1]), Number(rangeMatch[2])] };
    }

    const listMatch = trimmed.match(/^<(\d+(?:\.\d+)?),\s*>(\d+(?:\.\d+)?)$/);
    if (listMatch) {
      return {
        operator: 'not_between',
        value: [Number(listMatch[1]), Number(listMatch[2])],
      };
    }

    if (trimmed.startsWith('>=')) return { operator: 'gte', value: this.coerceNumber(trimmed.slice(2).trim()) };
    if (trimmed.startsWith('<=')) return { operator: 'lte', value: this.coerceNumber(trimmed.slice(2).trim()) };
    if (trimmed.startsWith('>')) return { operator: 'gt', value: this.coerceNumber(trimmed.slice(1).trim()) };
    if (trimmed.startsWith('<')) return { operator: 'lt', value: this.coerceNumber(trimmed.slice(1).trim()) };

    if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map(s => s.trim());
      return { operator: 'in', value: parts.map(p => this.coerceValue(p)) };
    }

    const num = Number(trimmed);
    if (!isNaN(num) && trimmed !== '') return { operator: 'eq', value: num };

    return { operator: 'eq', value: trimmed };
  }

  private coerceNumber(val: string): number {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  }

  private coerceValue(val: string): any {
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (val === 'null') return null;
    const n = Number(val);
    if (!isNaN(n) && val !== '') return n;
    return val;
  }

  private coerceOutput(val: any): any {
    if (typeof val === 'string') {
      if (val === 'true') return true;
      if (val === 'false') return false;
      if (val === 'null') return null;
      const n = Number(val);
      if (!isNaN(n)) return n;
    }
    return val;
  }

  private extractOutput(result: any): any {
    if (typeof result !== 'object' || result === null) return result;
    if ('result' in result && typeof result.result === 'object' && result.result !== null) {
      return result.result;
    }
    if ('output' in result) return result.output;
    return result;
  }

  private async resolveContext(params: ContextResolverInput): Promise<Record<string, any>> {
    if (params.contextKeys.length === 0) return {};

    const resolved: Record<string, any> = {};
    const now = Date.now();
    const dedupWindow = 2000;

    for (const key of params.contextKeys) {
      const ctxCacheKey = `${CACHE_PREFIX}ctx:${params.tenantId}:${key}:${Math.floor(now / dedupWindow)}`;
      const cached = await this.redis.get(ctxCacheKey);
      if (cached) {
        resolved[key] = JSON.parse(cached);
        continue;
      }

      if (key.startsWith('inventory.onHand')) {
        const query = params.inputData.productId
          ? await (this.prisma as any).inventoryOnHand.findMany({
              where: { tenantId: params.tenantId, productId: params.inputData.productId },
              select: { locationId: true, quantityOnHand: true, quantityAllocated: true },
            })
          : [];
        resolved[key] = query;
        await this.redis.setex(ctxCacheKey, 2, JSON.stringify(query));
      } else if (key.startsWith('carrier.rate')) {
        resolved[key] = { rate: 0, carrier: 'DEFAULT' };
      } else if (key.startsWith('product')) {
        const product = params.inputData.productId
          ? await (this.prisma as any).product.findFirst({
              where: { id: params.inputData.productId, tenantId: params.tenantId },
              select: { velocityClass: true, trackLot: true, trackExpiry: true },
            })
          : null;
        resolved[key] = product;
        if (product) await this.redis.setex(ctxCacheKey, 2, JSON.stringify(product));
      } else {
        resolved[key] = null;
      }
    }
    return resolved;
  }

  private createJdmEngine(definition: JdmDefinition) {
    return {
      evaluate: (input: Record<string, any>): any => {
        if (definition.decisionTable?.rules) {
          return this.evaluateDecisionTable(definition.decisionTable, input);
        }
        if (definition.rules) {
          return this.evaluateRules(definition.rules, input);
        }
        return definition.defaultOutput || {};
      },
    };
  }

  private evaluateDecisionTable(
    dt: JdmDecisionTable,
    input: Record<string, any>,
  ): any {
    const matchedRules: Array<{ rule: JdmRule; index: number }> = [];

    for (let i = 0; i < dt.rules.length; i++) {
      const rule = dt.rules[i];
      const conditions = rule.conditions || [];

      const allMatch = conditions.every((cond) => {
        const inputVal = this.resolveField(input, cond.field);
        if (inputVal === undefined) return false;
        return this.matchCondition(cond, inputVal);
      });

      if (allMatch) {
        matchedRules.push({ rule, index: i });
        if (!dt.hitPolicy || dt.hitPolicy === 'FIRST') break;
      }
    }

    return this.applyHitPolicy(matchedRules, dt.hitPolicy, dt.aggregation, dt.defaultOutput || {});
  }

  private resolveField(input: Record<string, any>, field: string): any {
    if (field.includes('.')) {
      const parts = field.split('.');
      let val: any = input;
      for (const part of parts) {
        if (val === null || val === undefined) return undefined;
        val = val[part];
      }
      return val;
    }
    return input[field];
  }

  private matchCondition(cond: JdmCondition, inputVal: any): boolean {
    const { operator, value } = cond;

    switch (operator) {
      case 'eq':
      case '=':
      case '==':
      case 'equals':
        return String(inputVal) === String(value);
      case 'neq':
      case '!=':
        return String(inputVal) !== String(value);
      case 'gt':
      case '>':
        return Number(inputVal) > Number(value);
      case 'gte':
      case '>=':
        return Number(inputVal) >= Number(value);
      case 'lt':
      case '<':
        return Number(inputVal) < Number(value);
      case 'lte':
      case '<=':
        return Number(inputVal) <= Number(value);
      case 'in':
        return Array.isArray(value) && value.some((v: any) => String(inputVal) === String(v));
      case 'not_in':
      case 'notIn':
        return Array.isArray(value) && value.every((v: any) => String(inputVal) !== String(v));
      case 'contains':
        return String(inputVal).includes(String(value));
      case 'not_contains':
      case 'notContains':
        return !String(inputVal).includes(String(value));
      case 'startsWith':
      case 'starts_with':
        return String(inputVal).startsWith(String(value));
      case 'endsWith':
      case 'ends_with':
        return String(inputVal).endsWith(String(value));
      case 'matches':
        try { return new RegExp(String(value)).test(String(inputVal)); }
        catch { return false; }
      case 'between': {
        if (!Array.isArray(value) || value.length < 2) return false;
        const num = Number(inputVal);
        return num >= Number(value[0]) && num <= Number(value[1]);
      }
      case 'not_between': {
        if (!Array.isArray(value) || value.length < 2) return false;
        const num = Number(inputVal);
        return num < Number(value[0]) || num > Number(value[1]);
      }
      case 'isNull':
      case 'is_null':
        return inputVal === null || inputVal === undefined || inputVal === '';
      case 'notNull':
      case 'not_null':
        return inputVal !== null && inputVal !== undefined && inputVal !== '';
      case 'blank':
      case 'is_blank':
        return inputVal === null || inputVal === undefined || inputVal === '' || inputVal === false;
      case 'not_blank':
      case 'notBlank':
        return inputVal !== null && inputVal !== undefined && inputVal !== '' && inputVal !== false;
      case 'lessThanDate':
      case 'lt_date':
        return new Date(inputVal) < new Date(value);
      case 'greaterThanDate':
      case 'gt_date':
        return new Date(inputVal) > new Date(value);
      default:
        return String(inputVal) === String(value);
    }
  }

  private applyHitPolicy(
    matchedRules: Array<{ rule: JdmRule; index: number }>,
    hitPolicy: string | undefined,
    aggregation: string | undefined,
    defaultOutput: Record<string, any>,
  ): any {
    if (matchedRules.length === 0) return defaultOutput;

    switch (hitPolicy) {
      case 'ALL': {
        const merged: Record<string, any> = {};
        for (const { rule } of matchedRules) {
          const out = rule.output || rule.then || rule.result || {};
          for (const [k, v] of Object.entries(out)) {
            if (!(k in merged)) {
              merged[k] = v;
            } else if (Array.isArray(merged[k])) {
              merged[k] = [...merged[k], v];
            } else {
              merged[k] = [merged[k], v];
            }
          }
        }
        return merged;
      }
      case 'PRIORITY':
        matchedRules.sort((a, b) => (b.rule.priority || 0) - (a.rule.priority || 0));
        return matchedRules[0].rule.output || matchedRules[0].rule.then || matchedRules[0].rule.result || {};
      case 'OUTPUT_ORDER':
      case 'RULE_ORDER':
        return matchedRules[0].rule.output || matchedRules[0].rule.then || matchedRules[0].rule.result || {};
      case 'COLLECT': {
        const outputs = matchedRules.map(r => r.rule.output || r.rule.then || r.rule.result || {});
        const out: Record<string, any> = { ...defaultOutput };
        for (const k of Object.keys(outputs[0] || {})) {
          const vals = outputs.map(o => o[k]).filter(v => v !== undefined);
          switch (aggregation) {
            case 'SUM':
              out[k] = vals.reduce((s: number, v: any) => s + Number(v || 0), 0);
              break;
            case 'MIN':
              out[k] = Math.min(...vals.map(Number));
              break;
            case 'MAX':
              out[k] = Math.max(...vals.map(Number));
              break;
            case 'COUNT':
              out[k] = vals.length;
              break;
            default:
              out[k] = vals.length === 1 ? vals[0] : vals;
              break;
          }
        }
        return out;
      }
      default:
        return matchedRules[0].rule.output || matchedRules[0].rule.then || matchedRules[0].rule.result || {};
    }
  }

  private evaluateRules(rules: JdmRule[], input: Record<string, any>): any {
    const sorted = [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const rule of sorted) {
      const conditions = rule.when || [];
      const allMatch = conditions.every((cond) => {
        const inputVal = this.resolveField(input, cond.field);
        if (inputVal === undefined) return false;
        return this.matchCondition(cond, inputVal);
      });
      if (allMatch) {
        const out = rule.then || rule.result || rule.output || {};
        if (Object.keys(out).length > 0) return out;
      }
    }

    return {};
  }

  private hashInput(input: Record<string, any>): string {
    const str = JSON.stringify(input, Object.keys(input).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  validateDefinition(definition: any) {
    const defStr = JSON.stringify(definition);
    if (defStr.includes('Function(') || defStr.includes('.constructor(')) {
      throw new BadRequestException('UnsafeRuleDefinition: dynamic code construction detected');
    }
    if (typeof definition?.decisionTable?.rules?.length === 'number') {
      for (const rule of definition.decisionTable.rules) {
        if ((rule.output || {})['__expr__']) {
          throw new BadRequestException('UnsafeRuleDefinition: custom expression in rule output');
        }
      }
    }
    if (definition?.rules) {
      for (const rule of definition.rules) {
        if (rule.then?.__expr__ || rule.result?.__expr__) {
          throw new BadRequestException('UnsafeRuleDefinition: custom expression in rule output');
        }
      }
    }
  }
}
