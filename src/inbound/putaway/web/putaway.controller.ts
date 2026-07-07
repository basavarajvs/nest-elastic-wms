import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { PutawayService } from '../putaway.service';
import { PutawayRuleService } from '../putaway-rule.service';
import {
  PutawayTaskDto,
  PutawayTaskListResponseDto,
  PutawayRuleDto,
  PutawayRuleListResponseDto,
  PutawayCompleteResultDto,
  RfAssignTaskResultDto,
  PutawaySuggestResultDto,
  CreatePutawayTaskDto,
  CompletePutawayTaskDto,
  SuggestLocationDto,
  CreatePutawayRuleDto,
  UpdatePutawayRuleDto,
} from '../dtos/putaway-response.dto';
import { DeleteResultDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Putaway')
@Controller('web/putaway-tasks')
export class PutawayController {
  constructor(
    private readonly putawayService: PutawayService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create putaway task' })
  @ApiCreatedResponse({ type: PutawayTaskDto })
  async createTask(@Req() req: any, @Body() dto: CreatePutawayTaskDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.createTask(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List putaway tasks' })
  @ApiOkResponse({ type: PutawayTaskListResponseDto })
  async findAllTasks(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.findAllTasks(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get putaway task' })
  @ApiOkResponse({ type: PutawayTaskDto })
  async findTaskById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.findTaskById(tenantId, BigInt(id));
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign putaway task to user' })
  @ApiOkResponse({ type: RfAssignTaskResultDto })
  async assignTask(
    @Req() req: any,
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    const tenantId = req.tenantContext.getTenantId();
    const taskId = BigInt(id);
    return this.putawayService.assignTask(tenantId, taskId, userId);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete putaway task' })
  @ApiOkResponse({ type: PutawayCompleteResultDto })
  async completeTask(@Req() req: any, @Param('id') id: string, @Body() dto: CompletePutawayTaskDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.completeTask(tenantId, BigInt(id), dto);
  }

  @Post('suggest-location')
  @ApiOperation({ summary: 'Suggest best location for putaway using rules engine' })
  @ApiCreatedResponse({ type: PutawaySuggestResultDto })
  async suggestLocation(@Req() req: any, @Body() dto: SuggestLocationDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.suggestLocation(
      tenantId,
      BigInt(dto.facility_id),
      BigInt(dto.product_id),
      dto.category_id ? BigInt(dto.category_id) : undefined,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete putaway task' })
  @ApiOkResponse({ type: DeleteResultDto })
  async deleteTask(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.delete(tenantId, BigInt(id));
  }

  @Get('by-grn/:grnNumber')
  @ApiOperation({ summary: 'Find tasks by GRN number' })
  @ApiOkResponse({ type: PutawayTaskDto, isArray: true })
  async findByGrn(@Req() req: any, @Param('grnNumber') grnNumber: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.findTasksByGrn(tenantId, grnNumber);
  }
}

@ApiTags('Putaway Rules')
@Controller('web/putaway-rules')
export class PutawayRuleController {
  constructor(private readonly ruleService: PutawayRuleService) {}

  @Post()
  @ApiOperation({ summary: 'Create putaway rule' })
  @ApiCreatedResponse({ type: PutawayRuleDto })
  async create(@Req() req: any, @Body() dto: CreatePutawayRuleDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.ruleService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List putaway rules' })
  @ApiOkResponse({ type: PutawayRuleListResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.ruleService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get putaway rule' })
  @ApiOkResponse({ type: PutawayRuleDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.ruleService.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update putaway rule' })
  @ApiOkResponse({ type: PutawayRuleDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdatePutawayRuleDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.ruleService.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete putaway rule' })
  @ApiOkResponse({ type: DeleteResultDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.ruleService.delete(tenantId, BigInt(id));
  }
}
