import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const DEPTH_LIMIT = 20;

interface StateMachineDefinition {
  id: string;
  tenantId: string;
  machineKey: string;
  name: string;
  version: number;
  definitionJson: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ExecutionInstance {
  id: string;
  tenantId: string;
  machineKey: string;
  entityType: string;
  entityId: string;
  currentState: string;
  context: any;
  history: any[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class StateMachineService {
  private readonly logger = new Logger(StateMachineService.name);

  private readonly FUNCTION_INJECTION_PATTERNS = [
    /Function\s*\(/i,
    /\beval\s*\(/i,
    /require\s*\(/i,
    /import\s*\(/i,
    /global\s*\./i,
    /process\s*\./i,
    /constructor\s*\(/i,
    /__proto__/i,
    /prototype\s*\./i,
  ];

  constructor(private readonly prisma: PrismaService) {}

  private sanitizeDefinitionJson(definitionJson: any): void {
    const raw =
      typeof definitionJson === 'string'
        ? definitionJson
        : JSON.stringify(definitionJson);
    for (const pattern of this.FUNCTION_INJECTION_PATTERNS) {
      if (pattern.test(raw)) {
        throw new BadRequestException(
          'Definition contains prohibited patterns (potential function injection)',
        );
      }
    }
  }

  async create(
    tenantId: string,
    userId: string,
    dto: any,
  ): Promise<StateMachineDefinition> {
    this.sanitizeDefinitionJson(dto.definitionJson);

    const existing = await this.prisma.$queryRawUnsafe<
      StateMachineDefinition[]
    >(
      `SELECT * FROM wms_state_machines WHERE tenant_id = $1 AND machine_key = $2 AND is_active = true LIMIT 1`,
      tenantId,
      dto.machineKey,
    );

    const version = existing.length > 0 ? Number(existing[0].version) + 1 : 1;

    const result = await this.prisma.$queryRawUnsafe<StateMachineDefinition[]>(
      `INSERT INTO wms_state_machines (tenant_id, machine_key, name, version, definition_json, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
       RETURNING *`,
      tenantId,
      dto.machineKey,
      dto.name,
      version,
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

    if (query.machineKey) {
      where.push(`machine_key = $${paramIdx++}`);
      params.push(query.machineKey);
    }
    if (query.isActive !== undefined) {
      where.push(`is_active = $${paramIdx++}`);
      params.push(query.isActive);
    }

    const whereClause = where.join(' AND ');

    const [data, countResult] = await Promise.all([
      this.prisma.$queryRawUnsafe<StateMachineDefinition[]>(
        `SELECT * FROM wms_state_machines WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        ...params,
        limit,
        offset,
      ),
      this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*) as count FROM wms_state_machines WHERE ${whereClause}`,
        ...params,
      ),
    ]);

    const total = Number(countResult[0]?.count || 0);
    return { data, total, page, limit };
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<StateMachineDefinition> {
    const result = await this.prisma.$queryRawUnsafe<StateMachineDefinition[]>(
      `SELECT * FROM wms_state_machines WHERE tenant_id = $1 AND id = $2`,
      tenantId,
      id,
    );
    if (!result.length)
      throw new NotFoundException('State machine definition not found');
    return result[0];
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: any,
  ): Promise<StateMachineDefinition> {
    await this.findById(tenantId, id);

    if (dto.definitionJson) {
      this.sanitizeDefinitionJson(dto.definitionJson);
    }

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

    const result = await this.prisma.$queryRawUnsafe<StateMachineDefinition[]>(
      `UPDATE wms_state_machines SET ${clause.join(', ')} WHERE tenant_id = $${idx} AND id = $${idx + 1} RETURNING *`,
      ...params,
      tenantId,
      id,
    );

    return result[0];
  }

  async delete(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM wms_state_machines WHERE tenant_id = $1 AND id = $2`,
      tenantId,
      id,
    );
    return { success: true, message: 'State machine definition deleted' };
  }

  async execute(
    tenantId: string,
    userId: string,
    machineKey: string,
    entityType: string,
    entityId: string,
    context: any,
  ): Promise<ExecutionInstance> {
    const definitions = await this.prisma.$queryRawUnsafe<
      StateMachineDefinition[]
    >(
      `SELECT * FROM wms_state_machines WHERE tenant_id = $1 AND machine_key = $2 AND is_active = true ORDER BY version DESC LIMIT 1`,
      tenantId,
      machineKey,
    );

    if (!definitions.length) {
      throw new NotFoundException(
        `No active state machine found for key: ${machineKey}`,
      );
    }

    const definition = definitions[0];
    const defJson =
      typeof definition.definitionJson === 'string'
        ? JSON.parse(definition.definitionJson)
        : definition.definitionJson;

    const initialState = defJson.initial || defJson.states?.[0]?.name;
    if (!initialState) {
      throw new BadRequestException(
        'State machine definition has no initial state',
      );
    }

    this.validateDepth(defJson, 0);

    const result = await this.prisma.$queryRawUnsafe<ExecutionInstance[]>(
      `INSERT INTO wms_execution_instances (tenant_id, machine_key, entity_type, entity_id, current_state, context, history, status, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10)
       RETURNING *`,
      tenantId,
      machineKey,
      entityType,
      entityId,
      initialState,
      JSON.stringify(context || {}),
      JSON.stringify([]),
      'RUNNING',
      userId,
      userId,
    );

    this.logger.log(
      `Execution instance ${result[0].id} created for ${machineKey} on ${entityType}:${entityId}`,
    );
    return result[0];
  }

  async transition(
    tenantId: string,
    userId: string,
    instanceId: string,
    event: string,
    context?: any,
  ): Promise<ExecutionInstance> {
    const instances = await this.prisma.$queryRawUnsafe<ExecutionInstance[]>(
      `SELECT * FROM wms_execution_instances WHERE tenant_id = $1 AND id = $2 AND status = 'RUNNING'`,
      tenantId,
      instanceId,
    );

    if (!instances.length) {
      throw new NotFoundException(
        'Execution instance not found or not running',
      );
    }

    const instance = instances[0];

    const definitions = await this.prisma.$queryRawUnsafe<
      StateMachineDefinition[]
    >(
      `SELECT * FROM wms_state_machines WHERE tenant_id = $1 AND machine_key = $2 AND is_active = true ORDER BY version DESC LIMIT 1`,
      tenantId,
      instance.machineKey,
    );

    if (!definitions.length) {
      throw new NotFoundException(
        `State machine definition not found for key: ${instance.machineKey}`,
      );
    }

    const definition = definitions[0];
    const defJson =
      typeof definition.definitionJson === 'string'
        ? JSON.parse(definition.definitionJson)
        : definition.definitionJson;

    const currentStateName = instance.currentState;
    const transitions = defJson.transitions || [];

    const validTransition = transitions.find(
      (t: any) =>
        t.from === currentStateName && (t.event === event || t.event === '*'),
    );

    if (!validTransition) {
      throw new BadRequestException(
        `No valid transition from state '${currentStateName}' on event '${event}'`,
      );
    }

    const mergedContext = context
      ? {
          ...(typeof instance.context === 'object' ? instance.context : {}),
          ...context,
        }
      : instance.context;

    const history = Array.isArray(instance.history) ? instance.history : [];
    history.push({
      from: currentStateName,
      to: validTransition.to,
      event,
      timestamp: new Date().toISOString(),
      userId,
    });

    const result = await this.prisma.$queryRawUnsafe<ExecutionInstance[]>(
      `UPDATE wms_execution_instances
       SET current_state = $1, context = $2::jsonb, history = $3::jsonb, updated_by = $4, updated_at = NOW()
       WHERE tenant_id = $5 AND id = $6
       RETURNING *`,
      validTransition.to,
      JSON.stringify(mergedContext),
      JSON.stringify(history),
      userId,
      tenantId,
      instanceId,
    );

    return result[0];
  }

  private validateDepth(node: any, depth: number): void {
    if (depth > DEPTH_LIMIT) {
      throw new BadRequestException(
        `State machine definition exceeds maximum depth of ${DEPTH_LIMIT}`,
      );
    }
    if (node.states && Array.isArray(node.states)) {
      for (const state of node.states) {
        this.validateDepth(state, depth + 1);
      }
    }
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        this.validateDepth(child, depth + 1);
      }
    }
  }
}
