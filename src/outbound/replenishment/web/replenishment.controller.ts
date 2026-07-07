import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../../common/decorators/audit-log.decorator';
import { ReplenishmentService } from '../replenishment.service';
import {
  ReplenishmentRuleDto, ReplenishmentRulePaginatedResponseDto,
  ReplenishmentTaskDto, ReplenishmentTaskPaginatedResponseDto,
  CreateReplenishmentRuleDto, UpdateReplenishmentRuleDto, UpdateReplenishmentTaskDto,
} from '../dtos/response.dto';
import { DeleteResultDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Outbound - Replenishment Rules')
@Controller('web/replenishment-rules')
@UseGuards(JwtAuthGuard, CaslGuard)
export class ReplenishmentRuleController {
  constructor(private readonly service: ReplenishmentService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'ReplenishmentRule' })
  @AuditLog({ eventType: 'REPLENISHMENT_RULE_CREATED', detail: (req, body) => `Created replenishment rule for product ${body.productId}` })
  @ApiCreatedResponse({ type: ReplenishmentRuleDto })
  async createRule(@Req() req: any, @Body() dto: CreateReplenishmentRuleDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.service.createRule(tenantId, userId, dto);
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'ReplenishmentRule' })
  @ApiOkResponse({ type: ReplenishmentRulePaginatedResponseDto })
  async findAllRules(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAllRules(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'ReplenishmentRule' })
  @ApiOkResponse({ type: ReplenishmentRuleDto })
  async findRuleById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findRuleById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'ReplenishmentRule' })
  @AuditLog({ eventType: 'REPLENISHMENT_RULE_UPDATED', detail: (req) => `Updated replenishment rule ${req.params.id}` })
  @ApiOkResponse({ type: ReplenishmentRuleDto })
  async updateRule(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateReplenishmentRuleDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.service.updateRule(tenantId, BigInt(id), userId, dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'ReplenishmentRule' })
  @AuditLog({ eventType: 'REPLENISHMENT_RULE_DELETED', detail: (req) => `Deleted replenishment rule ${req.params.id}` })
  @ApiOkResponse({ type: DeleteResultDto })
  async deleteRule(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.deleteRule(tenantId, BigInt(id));
  }
}

@ApiTags('Outbound - Replenishment Tasks')
@Controller('web/replenishment-tasks')
@UseGuards(JwtAuthGuard, CaslGuard)
export class ReplenishmentTaskController {
  constructor(private readonly service: ReplenishmentService) {}

  @Get()
  @CheckAbility({ action: 'read', subject: 'ReplenishmentTask' })
  @ApiOkResponse({ type: ReplenishmentTaskPaginatedResponseDto })
  async findAllTasks(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAllTasks(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'ReplenishmentTask' })
  @ApiOkResponse({ type: ReplenishmentTaskDto })
  async findTaskById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findTaskById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'ReplenishmentTask' })
  @AuditLog({ eventType: 'REPLENISHMENT_TASK_UPDATED', detail: (req) => `Updated replenishment task ${req.params.id}` })
  @ApiOkResponse({ type: ReplenishmentTaskDto })
  async updateTask(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateReplenishmentTaskDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.service.updateTask(tenantId, BigInt(id), userId, dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'ReplenishmentTask' })
  @AuditLog({ eventType: 'REPLENISHMENT_TASK_DELETED', detail: (req) => `Deleted replenishment task ${req.params.id}` })
  @ApiOkResponse({ type: DeleteResultDto })
  async deleteTask(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.deleteTask(tenantId, BigInt(id));
  }
}
