import { ApiTags } from '@nestjs/swagger';
import { Controller, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { WorkOrdersService } from '../work-orders.service';
import { OperationsService } from '../operations.service';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { RfAction } from '../../common/guards/rf-action.decorator';
import { RfActionLightweightGuard } from '../../common/guards/rf-action-lightweight.guard';

@ApiTags('WMS-RF')
@Controller('rf/work-orders')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class WorkOrdersRfController {
  constructor(
    private readonly workOrdersService: WorkOrdersService,
    private readonly operationsService: OperationsService,
  ) {}

  @Post('/my-tasks')
  @RfAction('read')
  async getMyTasks(@Req() req: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.userId;
    return this.workOrdersService.findByAssignedUser(tenantId, userId);
  }

  @Post('/:id/start-operation')
  @RfAction('update')
  async startOperation(@Param('id') id: string, @Body('operationId') operationId: string, @Req() req: any) {
    return this.operationsService.startOperation(id, operationId, req.tenantContext.getTenantId());
  }

  @Post('/:id/complete-operation')
  @RfAction('update')
  async completeOperation(@Param('id') id: string, @Body('operationId') operationId: string, @Body('actualMinutes') actualMinutes: number, @Req() req: any) {
    return this.operationsService.completeOperation(id, operationId, req.tenantContext.getTenantId(), actualMinutes);
  }
}
