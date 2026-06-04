import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ReplenishmentService } from '../replenishment.service';
import { CreateReplenishmentTaskDto, CreateReplenishmentSuggestionDto, UpdateReplenishmentSuggestionDto, CompleteReplenishmentTaskDto, ReplenishmentFilterDto } from '../dtos/replenishment.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/replenishment')
@UseGuards(CaslGuard)
export class ReplenishmentWebController {
  constructor(private readonly replenishmentService: ReplenishmentService) {}

  @Get('/suggestions')
  @CheckAbility({ action: 'read', subject: 'Replenishment' })
  @ApiOperation({ summary: 'Get replenishment suggestions for products below min threshold' })
  async getSuggestions(@Req() req: any, @Query('facilityId') facilityId: string) {
    return this.replenishmentService.getSuggestions(req.tenantContext.getTenantId(), facilityId);
  }

  @Post('/suggestions')
  @CheckAbility({ action: 'create', subject: 'Replenishment' })
  @ApiOperation({ summary: 'Convert a suggestion into a replenishment task' })
  async createSuggestion(@Req() req: any, @Body() dto: CreateReplenishmentSuggestionDto) {
    return this.replenishmentService.createSuggestion(dto, req.tenantContext.getTenantId(), req.user?.userId);
  }

  @Patch('/suggestions/:productId')
  @CheckAbility({ action: 'update', subject: 'Replenishment' })
  @ApiOperation({ summary: 'Update product replenishment thresholds' })
  async updateSuggestion(@Req() req: any, @Param('productId') productId: string, @Body() dto: UpdateReplenishmentSuggestionDto) {
    return this.replenishmentService.updateSuggestion(productId, dto, req.tenantContext.getTenantId());
  }

  @Delete('/suggestions/:productId')
  @CheckAbility({ action: 'delete', subject: 'Replenishment' })
  @ApiOperation({ summary: 'Dismiss suggestion by clearing product replenishment thresholds' })
  async deleteSuggestion(@Req() req: any, @Param('productId') productId: string) {
    return this.replenishmentService.deleteSuggestion(productId, req.tenantContext.getTenantId());
  }

  @Post('/tasks')
  @CheckAbility({ action: 'create', subject: 'Replenishment' })
  @ApiOperation({ summary: 'Create a replenishment task' })
  async createTask(@Req() req: any, @Body() dto: CreateReplenishmentTaskDto) {
    return this.replenishmentService.createTask(dto, req.tenantContext.getTenantId(), req.user?.userId);
  }

  @Get('/tasks')
  @CheckAbility({ action: 'read', subject: 'Replenishment' })
  @ApiOperation({ summary: 'List replenishment tasks' })
  async listTasks(@Req() req: any, @Query() filter: ReplenishmentFilterDto) {
    return this.replenishmentService.listTasks(req.tenantContext.getTenantId(), filter);
  }

  @Get('/tasks/:id')
  @CheckAbility({ action: 'read', subject: 'Replenishment' })
  @ApiOperation({ summary: 'Get replenishment task by id' })
  async getTask(@Req() req: any, @Param('id') id: string) {
    return this.replenishmentService.getTaskById(id, req.tenantContext.getTenantId());
  }

  @Post('/tasks/:id/complete')
  @CheckAbility({ action: 'update', subject: 'Replenishment' })
  @ApiOperation({ summary: 'Complete a replenishment task' })
  async completeTask(@Req() req: any, @Param('id') id: string, @Body() dto: CompleteReplenishmentTaskDto) {
    return this.replenishmentService.completeTask(id, dto.fulfilledQuantity, req.tenantContext.getTenantId(), req.user?.userId);
  }

  @Patch('/tasks/:id/cancel')
  @CheckAbility({ action: 'update', subject: 'Replenishment' })
  @ApiOperation({ summary: 'Cancel a replenishment task' })
  async cancelTask(@Req() req: any, @Param('id') id: string) {
    return this.replenishmentService.cancelTask(id, req.tenantContext.getTenantId());
  }
}
