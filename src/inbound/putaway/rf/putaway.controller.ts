import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse } from '@nestjs/swagger';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';
import { PutawayService } from '../putaway.service';
import {
  PutawayTaskDto,
  PutawayTaskListResponseDto,
  PutawaySuggestResultDto,
  PutawayDamageRecordDto,
  PutawayCompleteResultDto,
  RfStartTaskResultDto,
  RfAssignTaskResultDto,
  RfValidateLocationResultDto,
  RfScanLpnDto,
  RfAssignDto,
  RfScanLocationDto,
  RfSuggestLocationDto,
  RfConfirmDto,
  RfLocationFullDto,
  RfReportDamageDto,
} from '../dtos/putaway-response.dto';

@ApiTags('RF - Putaway')
@Controller('rf/inbound/putaway')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class RfPutawayController {
  constructor(private readonly putawayService: PutawayService) {}

  @Post('next-task')
  @ApiOperation({ summary: 'Get next unassigned putaway task for the facility (RF)' })
  @ApiCreatedResponse({ type: PutawayTaskDto })
  @RfAction('update')
  async nextTask(@Req() req: any, @Body('facilityId') facilityId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.nextTask(tenantId, BigInt(facilityId));
  }

  @Post('scan-lpn')
  @ApiOperation({ summary: 'Lookup putaway task by scanning LPN barcode (RF)' })
  @ApiCreatedResponse({ type: PutawayTaskDto })
  @RfAction('read')
  async scanLpn(@Req() req: any, @Body() dto: RfScanLpnDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.findTaskByLpn(tenantId, BigInt(dto.facility_id), dto.lpn_barcode);
  }

  @Post('start')
  @ApiOperation({ summary: 'Start working on a putaway task (RF)' })
  @ApiCreatedResponse({ type: RfStartTaskResultDto })
  @RfAction('update')
  async start(@Req() req: any, @Body('taskId') taskId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.startTask(tenantId, BigInt(taskId));
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assign putaway task to a user (RF)' })
  @ApiCreatedResponse({ type: RfAssignTaskResultDto })
  @RfAction('update')
  async assign(@Req() req: any, @Body() dto: RfAssignDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.assignTask(tenantId, BigInt(dto.task_id), dto.user_id);
  }

  @Post('scan-location')
  @ApiOperation({ summary: 'Scan location barcode to validate against directed putaway location (RF)' })
  @ApiCreatedResponse({ type: RfValidateLocationResultDto })
  @RfAction('read')
  async scanLocation(@Req() req: any, @Body() dto: RfScanLocationDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id || 0);
    return this.putawayService.validateLocation(tenantId, facilityId, BigInt(dto.task_id), dto.location_barcode);
  }

  @Post('suggest-location')
  @ApiOperation({ summary: 'Suggest putaway location for a task (RF)' })
  @ApiCreatedResponse({ type: PutawaySuggestResultDto })
  @RfAction('read')
  async suggestLocation(@Req() req: any, @Body() dto: RfSuggestLocationDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.suggestLocation(
      tenantId, BigInt(dto.facility_id), BigInt(dto.product_id),
      dto.category_id ? BigInt(dto.category_id) : undefined,
      dto.from_location_id ? BigInt(dto.from_location_id) : undefined,
      dto.has_expiry,
    );
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm putaway placement (RF)' })
  @ApiCreatedResponse({ type: PutawayCompleteResultDto })
  @RfAction('update')
  async confirm(@Req() req: any, @Body() dto: RfConfirmDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.confirmPutaway(tenantId, dto);
  }

  @Post('my-tasks')
  @ApiOperation({ summary: 'Get my assigned putaway tasks (RF)' })
  @ApiCreatedResponse({ type: PutawayTaskListResponseDto })
  @RfAction('read')
  async myTasks(@Req() req: any, @Body('userId') userId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.findAllTasks(tenantId, { assignedToUserId: userId, status: 'ASSIGNED' });
  }

  @Post('location-full')
  @ApiOperation({ summary: 'Flag location as full, get alternate (RF)' })
  @ApiCreatedResponse({ type: PutawaySuggestResultDto })
  @RfAction('update')
  async locationFull(@Req() req: any, @Body() dto: RfLocationFullDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId || dto.user_id;
    return this.putawayService.locationFullException(tenantId, BigInt(dto.task_id), userId);
  }

  @Post('report-damage')
  @ApiOperation({ summary: 'Report damage during putaway movement (RF)' })
  @ApiCreatedResponse({ type: PutawayDamageRecordDto })
  @RfAction('update')
  async reportDamage(@Req() req: any, @Body() dto: RfReportDamageDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.reportDamage(tenantId, BigInt(dto.task_id), { ...dto, userId: req.rfSession?.userId || dto.user_id });
  }
}
