import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const DEPTH_LIMIT = 50;

interface BpmnProcessDefinition {
  id: string;
  tenantId: string;
  processKey: string;
  name: string;
  version: number;
  bpmnXml: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface BpmnExecutionResult {
  id: string;
  processKey: string;
  status: string;
  context: any;
  variables: any;
  startedAt: Date;
}

@Injectable()
export class BpmnService {
  private readonly logger = new Logger(BpmnService.name);

  private readonly SCRIPT_TASK_PATTERN = /<bpmn:scriptTask[\s>]/i;
  private readonly SCRIPT_IN_EXTENSION =
    /<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/gi;

  constructor(private readonly prisma: PrismaService) {}

  private validateBpmnXml(bpmnXml: string): void {
    if (this.SCRIPT_TASK_PATTERN.test(bpmnXml)) {
      throw new BadRequestException(
        'scriptTask elements are not allowed in BPMN definitions',
      );
    }
    const scriptMatches = bpmnXml.match(this.SCRIPT_IN_EXTENSION);
    if (scriptMatches) {
      throw new BadRequestException(
        'Script extensions are not allowed in BPMN definitions',
      );
    }
  }

  private validateDepth(bpmnXml: string, currentDepth: number = 0): void {
    if (currentDepth > DEPTH_LIMIT) {
      throw new BadRequestException(
        `BPMN definition exceeds maximum depth of ${DEPTH_LIMIT}`,
      );
    }
    const subprocessPattern = /<bpmn:subProcess[\s>]/gi;
    const matches = bpmnXml.match(subprocessPattern);
    if (matches) {
      for (const _match of matches) {
        this.validateDepth(bpmnXml, currentDepth + 1);
      }
    }
  }

  async create(
    tenantId: string,
    userId: string,
    dto: any,
  ): Promise<BpmnProcessDefinition> {
    this.validateBpmnXml(dto.bpmnXml);
    this.validateDepth(dto.bpmnXml);

    const existing = await this.prisma.$queryRawUnsafe<BpmnProcessDefinition[]>(
      `SELECT * FROM wms_bpmn_processes WHERE tenant_id = $1 AND process_key = $2 AND is_active = true LIMIT 1`,
      tenantId,
      dto.processKey,
    );

    const version = existing.length > 0 ? Number(existing[0].version) + 1 : 1;

    const result = await this.prisma.$queryRawUnsafe<BpmnProcessDefinition[]>(
      `INSERT INTO wms_bpmn_processes (tenant_id, process_key, name, version, bpmn_xml, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      tenantId,
      dto.processKey,
      dto.name,
      version,
      dto.bpmnXml,
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

    if (query.processKey) {
      where.push(`process_key = $${paramIdx++}`);
      params.push(query.processKey);
    }
    if (query.isActive !== undefined) {
      where.push(`is_active = $${paramIdx++}`);
      params.push(query.isActive);
    }

    const whereClause = where.join(' AND ');

    const [data, countResult] = await Promise.all([
      this.prisma.$queryRawUnsafe<BpmnProcessDefinition[]>(
        `SELECT * FROM wms_bpmn_processes WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        ...params,
        limit,
        offset,
      ),
      this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*) as count FROM wms_bpmn_processes WHERE ${whereClause}`,
        ...params,
      ),
    ]);

    const total = Number(countResult[0]?.count || 0);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: string): Promise<BpmnProcessDefinition> {
    const result = await this.prisma.$queryRawUnsafe<BpmnProcessDefinition[]>(
      `SELECT * FROM wms_bpmn_processes WHERE tenant_id = $1 AND id = $2`,
      tenantId,
      id,
    );
    if (!result.length)
      throw new NotFoundException('BPMN process definition not found');
    return result[0];
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: any,
  ): Promise<BpmnProcessDefinition> {
    await this.findById(tenantId, id);

    if (dto.bpmnXml) {
      this.validateBpmnXml(dto.bpmnXml);
      this.validateDepth(dto.bpmnXml);
    }

    const clause: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (dto.name !== undefined) {
      clause.push(`name = $${idx++}`);
      params.push(dto.name);
    }
    if (dto.bpmnXml !== undefined) {
      clause.push(`bpmn_xml = $${idx++}`);
      params.push(dto.bpmnXml);
    }
    if (dto.isActive !== undefined) {
      clause.push(`is_active = $${idx++}`);
      params.push(dto.isActive);
    }
    clause.push(`updated_by = $${idx++}`);
    params.push(userId);
    clause.push(`updated_at = NOW()`);

    params.push(tenantId, id);

    const result = await this.prisma.$queryRawUnsafe<BpmnProcessDefinition[]>(
      `UPDATE wms_bpmn_processes SET ${clause.join(', ')} WHERE tenant_id = $${idx} AND id = $${idx + 1} RETURNING *`,
      ...params,
      tenantId,
      id,
    );

    return result[0];
  }

  async delete(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM wms_bpmn_processes WHERE tenant_id = $1 AND id = $2`,
      tenantId,
      id,
    );
    return { success: true, message: 'BPMN process definition deleted' };
  }

  async start(
    tenantId: string,
    userId: string,
    processKey: string,
    context: Record<string, any>,
  ): Promise<BpmnExecutionResult> {
    const definitions = await this.prisma.$queryRawUnsafe<
      BpmnProcessDefinition[]
    >(
      `SELECT * FROM wms_bpmn_processes WHERE tenant_id = $1 AND process_key = $2 AND is_active = true ORDER BY version DESC LIMIT 1`,
      tenantId,
      processKey,
    );

    if (!definitions.length) {
      throw new NotFoundException(
        `No active BPMN process found for key: ${processKey}`,
      );
    }

    const definition = definitions[0];

    const result = await this.prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO wms_bpmn_executions (tenant_id, process_key, process_version, bpmn_xml, context, variables, status, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9)
       RETURNING id, process_key, status, context, variables, created_at as "startedAt"`,
      tenantId,
      processKey,
      definition.version,
      definition.bpmnXml,
      JSON.stringify(context || {}),
      JSON.stringify({}),
      'RUNNING',
      userId,
      userId,
    );

    this.logger.log(`BPMN execution ${result[0].id} started for ${processKey}`);
    return result[0];
  }
}
