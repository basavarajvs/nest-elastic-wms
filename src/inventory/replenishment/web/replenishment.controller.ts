import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ReplenishmentService } from '../replenishment.service';
import { CreateReplenishmentTaskDto, CompleteReplenishmentTaskDto, ReplenishmentFilterDto } from '../dtos/replenishment.dto';
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
}
