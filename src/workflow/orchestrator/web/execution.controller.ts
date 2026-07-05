import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { PrismaService } from '../../../prisma/prisma.service';

@ApiTags('Workflow - Executions')
@UseGuards(JwtAuthGuard, CaslGuard)
@Controller('web/workflow/instances')
export class ExecutionController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @CheckAbility({ action: 'read', subject: 'Workflow' })
  @ApiOperation({ summary: 'List execution instances' })
  async findAll(@Req() req: any, @Query() query: any): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const where: string[] = [`tenant_id = $1`];
    const params: any[] = [tenantId];
    let paramIdx = 2;

    if (query.status) {
      where.push(`status = $${paramIdx++}`);
      params.push(query.status);
    }
    if (query.machineKey) {
      where.push(`machine_key = $${paramIdx++}`);
      params.push(query.machineKey);
    }
    if (query.entityType) {
      where.push(`entity_type = $${paramIdx++}`);
      params.push(query.entityType);
    }
    if (query.entityId) {
      where.push(`entity_id = $${paramIdx++}`);
      params.push(query.entityId);
    }

    const whereClause = where.join(' AND ');

    const [executions, bpmnExecutions] = await Promise.all([
      this.prisma.$queryRawUnsafe<any[]>(
        `SELECT id, machine_key, entity_type, entity_id, current_state, status, created_at, updated_at
         FROM wms_execution_instances
         WHERE ${whereClause}
         ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        ...params,
        limit,
        offset,
      ),
      this.prisma.$queryRawUnsafe<any[]>(
        `SELECT id, process_key, status, created_at, updated_at
         FROM wms_bpmn_executions
         WHERE ${whereClause}
         ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        ...params,
        limit,
        offset,
      ),
    ]);

    return {
      stateMachineInstances: executions,
      bpmnExecutions: bpmnExecutions,
      page,
      limit,
    };
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Workflow' })
  @ApiOperation({ summary: 'Get execution instance by ID' })
  async findById(@Req() req: any, @Param('id') id: string): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();

    const [execution, bpmnExecution] = await Promise.all([
      this.prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM wms_execution_instances WHERE tenant_id = $1 AND id = $2`,
        tenantId,
        id,
      ),
      this.prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM wms_bpmn_executions WHERE tenant_id = $1 AND id = $2`,
        tenantId,
        id,
      ),
    ]);

    if (execution.length) return execution[0];
    if (bpmnExecution.length) return bpmnExecution[0];

    return { message: 'Instance not found', id };
  }
}
