import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { VasExecutionService } from '../vas-execution.service';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfAction } from '../../../common/guards/rf-action.decorator';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';

@ApiTags('WMS-RF')
@Controller('rf/vas-tasks')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class VasExecutionRfController {
  constructor(private readonly service: VasExecutionService) {}

  @Get('/my-tasks')
  @RfAction('read')
  async getMyTasks(@Req() req: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.userId;
    return this.service.findAll(tenantId, { status: 'PENDING' });
  }

  @Post('/:id/start')
  @RfAction('update')
  async startTask(@Param('id') id: string, @Req() req: any) {
    return this.service.updateTask(id, { status: 'IN_PROGRESS' }, req.tenantContext.getTenantId());
  }

  @Post('/:id/complete')
  @RfAction('update')
  async completeTask(@Param('id') id: string, @Body('quantityCompleted') qty: number, @Req() req: any) {
    return this.service.updateTask(id, { status: 'COMPLETED', quantityCompleted: qty }, req.tenantContext.getTenantId());
  }
}
