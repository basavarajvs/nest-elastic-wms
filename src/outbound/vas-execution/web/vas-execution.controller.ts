import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../../common/decorators/audit-log.decorator';
import { VasExecutionService } from '../vas-execution.service';
import {
  VasExecutionTaskDto, VasExecutionTaskPaginatedResponseDto,
  VasExecutionChargeDto, VasExecutionChargePaginatedResponseDto,
  CreateVasTaskDto, CompleteVasTaskDto,
} from '../dtos/response.dto';
import { DeleteResultDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Outbound - VAS Execution')
@Controller('web/vas')
@UseGuards(JwtAuthGuard, CaslGuard)
export class VasExecutionWebController {
  constructor(private readonly service: VasExecutionService) {}

  @Post('tasks')
  @CheckAbility({ action: 'create', subject: 'VasExecutionTask' })
  @AuditLog({ eventType: 'VAS_TASK_CREATED', detail: (req, body) => `Created VAS task ${body.taskNumber}` })
  @ApiCreatedResponse({ type: VasExecutionTaskDto })
  async createTask(@Req() req: any, @Body() dto: CreateVasTaskDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.service.createTask(tenantId, userId, dto);
  }

  @Get('tasks')
  @CheckAbility({ action: 'read', subject: 'VasExecutionTask' })
  @ApiOkResponse({ type: VasExecutionTaskPaginatedResponseDto })
  async findAllTasks(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAllTasks(tenantId, query);
  }

  @Get('tasks/:id')
  @CheckAbility({ action: 'read', subject: 'VasExecutionTask' })
  @ApiOkResponse({ type: VasExecutionTaskDto })
  async findTaskById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findTaskById(tenantId, BigInt(id));
  }

  @Patch('tasks/:id')
  @CheckAbility({ action: 'update', subject: 'VasExecutionTask' })
  @AuditLog({ eventType: 'VAS_TASK_UPDATED', detail: (req) => `Updated VAS task ${req.params.id}` })
  @ApiOkResponse({ type: VasExecutionTaskDto })
  async updateTask(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findTaskById(tenantId, BigInt(id));
  }

  @Delete('tasks/:id')
  @CheckAbility({ action: 'delete', subject: 'VasExecutionTask' })
  @AuditLog({ eventType: 'VAS_TASK_DELETED', detail: (req) => `Deleted VAS task ${req.params.id}` })
  @ApiOkResponse({ type: DeleteResultDto })
  async deleteTask(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.deleteTask(tenantId, BigInt(id));
  }

  @Post('tasks/:id/start')
  @CheckAbility({ action: 'update', subject: 'VasExecutionTask' })
  @AuditLog({ eventType: 'VAS_TASK_STARTED', detail: (req) => `Started VAS task ${req.params.id}` })
  @ApiOperation({ summary: 'Start a VAS execution task' })
  @ApiCreatedResponse({ type: VasExecutionTaskDto })
  async startTask(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.service.startTask(tenantId, BigInt(id), userId);
  }

  @Post('tasks/:id/complete')
  @CheckAbility({ action: 'update', subject: 'VasExecutionTask' })
  @AuditLog({ eventType: 'VAS_TASK_COMPLETED', detail: (req) => `Completed VAS task ${req.params.id}` })
  @ApiOperation({ summary: 'Complete a VAS execution task with charges' })
  @ApiCreatedResponse({ type: VasExecutionTaskDto })
  async completeTask(@Req() req: any, @Param('id') id: string, @Body() dto: CompleteVasTaskDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.service.completeTask(tenantId, BigInt(id), userId, dto);
  }

  @Get('charges')
  @CheckAbility({ action: 'read', subject: 'VasExecutionCharge' })
  @ApiOkResponse({ type: VasExecutionChargePaginatedResponseDto })
  async findCharges(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findCharges(tenantId, query);
  }
}
