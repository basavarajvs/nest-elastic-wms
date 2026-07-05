import { Controller, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../common/decorators/rf-action.decorator';
import { WorkOrdersService } from '../work-orders.service';
import { OperationsService } from '../operations.service';

@ApiTags('WMS-RF - Work Orders')
@Controller('rf/work-orders')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class WorkOrderRfController {
  constructor(
    private readonly workOrdersService: WorkOrdersService,
    private readonly operationsService: OperationsService,
  ) {}

  @Post('my-tasks')
  @RfAction('read')
  async myTasks(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId;
    return this.workOrdersService.findAll(tenantId, {
      facilityId: dto.facilityId,
      assignedToUserId: userId,
      status: 'IN_PROGRESS',
      ...dto,
    });
  }

  @Post(':id/start-operation')
  @RfAction('update')
  async startOperation(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId;
    return this.operationsService.startOperation(tenantId, BigInt(dto.operationId), userId);
  }

  @Post(':id/complete-operation')
  @RfAction('update')
  async completeOperation(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId;
    return this.operationsService.completeOperation(tenantId, BigInt(dto.operationId), userId);
  }
}
