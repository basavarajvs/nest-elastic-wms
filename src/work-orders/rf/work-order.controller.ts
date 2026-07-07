import { Controller, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../common/decorators/rf-action.decorator';
import { WorkOrdersService } from '../work-orders.service';
import { OperationsService } from '../operations.service';
import { WorkOrderResponseDto, WorkOrderOperationResponseDto, RfMyTasksDto, RfStartOperationDto, RfCompleteOperationDto } from '../dtos/work-order.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

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
  @ApiOkResponse({ type: PaginatedResponseDto })
  async myTasks(@Req() req: any, @Body() dto: RfMyTasksDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId;
    return this.workOrdersService.findAll(tenantId, {
      facilityId: dto.facility_id,
      assignedToUserId: userId,
      status: 'IN_PROGRESS',
      ...dto,
    });
  }

  @Post(':id/start-operation')
  @RfAction('update')
  @ApiCreatedResponse({ type: WorkOrderOperationResponseDto })
  async startOperation(@Req() req: any, @Param('id') id: string, @Body() dto: RfStartOperationDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId;
    return this.operationsService.startOperation(tenantId, BigInt(dto.operation_id), userId);
  }

  @Post(':id/complete-operation')
  @RfAction('update')
  @ApiCreatedResponse({ type: WorkOrderOperationResponseDto })
  async completeOperation(@Req() req: any, @Param('id') id: string, @Body() dto: RfCompleteOperationDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId;
    return this.operationsService.completeOperation(tenantId, BigInt(dto.operation_id), userId);
  }
}
