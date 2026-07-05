import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PutawayService } from '../putaway.service';
import { PutawayRuleService } from '../putaway-rule.service';

@ApiTags('Putaway')
@Controller('web/putaway-tasks')
export class PutawayController {
  constructor(
    private readonly putawayService: PutawayService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create putaway task' })
  async createTask(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.createTask(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List putaway tasks' })
  async findAllTasks(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.findAllTasks(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get putaway task' })
  async findTaskById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.findTaskById(tenantId, BigInt(id));
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign putaway task to user' })
  async assignTask(
    @Req() req: any,
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.assignTask(tenantId, BigInt(id), userId);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete putaway task' })
  async completeTask(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.completeTask(tenantId, BigInt(id), dto);
  }

  @Post('suggest-location')
  @ApiOperation({ summary: 'Suggest best location for putaway using rules engine' })
  async suggestLocation(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.suggestLocation(
      tenantId,
      BigInt(dto.facilityId),
      BigInt(dto.productId),
      dto.categoryId ? BigInt(dto.categoryId) : undefined,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete putaway task' })
  async deleteTask(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.delete(tenantId, BigInt(id));
  }

  @Get('by-grn/:grnNumber')
  @ApiOperation({ summary: 'Find tasks by GRN number' })
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
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.ruleService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List putaway rules' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.ruleService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get putaway rule' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.ruleService.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update putaway rule' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.ruleService.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete putaway rule' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.ruleService.delete(tenantId, BigInt(id));
  }
}
