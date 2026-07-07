import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../../casl/casl.types';
import { PickingTaskService } from '../picking-task.service';
import { PickingTaskDto, PickingTaskPaginatedResponseDto, PickingTaskDetailDto, CompleteTaskDto, CancelTaskDto } from '../dtos/response.dto';

@ApiTags('Outbound - Picking Tasks')
@Controller('web/picking-tasks')
@UseGuards(JwtAuthGuard, CaslGuard)
export class PickingTaskWebController {
  constructor(private readonly service: PickingTaskService) {}

  @Post()
  @CheckAbility({ action: WmsAction.List, subject: 'PickingTask' })
  @ApiOkResponse({ type: PickingTaskPaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAllTasks(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'PickingTask' })
  @ApiOkResponse({ type: PickingTaskDetailDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findTaskById(tenantId, BigInt(id));
  }

  @Patch(':id/assign')
  @CheckAbility({ action: WmsAction.Update, subject: 'PickingTask' })
  @ApiOkResponse({ type: PickingTaskDetailDto })
  async assign(@Req() req: any, @Param('id') id: string, @Body('userId') userId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.assignTask(tenantId, BigInt(id), userId);
  }

  @Post(':id/complete')
  @CheckAbility({ action: WmsAction.Update, subject: 'PickingTask' })
  @AuditLog({ eventType: 'PICKING_TASK_COMPLETE', detail: (req) => `Completed picking task ${req.params.id}` })
  @ApiCreatedResponse({ type: PickingTaskDetailDto })
  async complete(@Req() req: any, @Param('id') id: string, @Body() dto: CompleteTaskDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.service.completeTask(tenantId, id, userId);
  }

  @Patch(':id/cancel')
  @CheckAbility({ action: WmsAction.Cancel, subject: 'PickingTask' })
  @AuditLog({ eventType: 'PICKING_TASK_CANCEL', detail: (req) => `Cancelled picking task ${req.params.id}` })
  @ApiOkResponse({ type: PickingTaskDetailDto })
  async cancel(@Req() req: any, @Param('id') id: string, @Body() dto: CancelTaskDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.cancelTask(tenantId, id, dto.reason);
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'PickingTask' })
  @ApiOperation({ summary: 'Delete picking task' })
  @ApiOkResponse({ type: PickingTaskDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.deleteTask(tenantId, BigInt(id));
  }
}
