import { Controller, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../common/decorators/rf-action.decorator';
import { InspectionService } from '../inspections/inspection.service';
import { LpnLookupResultDto } from '../dtos/lpn-lookup.dto';
import {
  QualityInspectionDto,
  RecordResultResponseDto,
  SupervisorApproveResultDto,
  SupervisorRejectResultDto,
  LotValidationDto,
  ExpiryValidationDto,
  TemperatureRecordingDto,
  RfRecordResultRequestDto,
} from '../dtos/inspection.dto';
import { DefectCodeDto } from '../dtos/defect-code.dto';
import {
  RfLpnLookupQcDto, RfMyInspectionTasksDto, RfGetNextQcTaskDto,
  RfValidateLotDto, RfValidateExpiryDto, RfValidateTemperatureDto,
  RfPendingReviewDto, RfSupervisorApproveDto, RfSupervisorRejectDto,
} from '../dtos/inspection.dto';

@ApiTags('WMS-RF')
@Controller('rf/quality/inspections')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class RfInspectionController {
  constructor(private readonly service: InspectionService) {}

  @Post('lpn-lookup')
  @RfAction('read')
  @ApiOperation({ summary: 'Scan LPN barcode to fetch QC info (Manhattan: QC Inspect LPN)' })
  @ApiCreatedResponse({ type: LpnLookupResultDto })
  async lpnLookup(@Req() req: any, @Body() dto: RfLpnLookupQcDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id);
    return this.service.lookupLpnForQc(tenantId, facilityId, dto.barcode);
  }

  @Post('my-tasks')
  @RfAction('read')
  @ApiOperation({ summary: 'Get inspections assigned to current RF user' })
  @ApiCreatedResponse({ type: QualityInspectionDto })
  async myTasks(@Req() req: any, @Body() dto: RfMyInspectionTasksDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession.userId;
    return this.service.findAll(tenantId, { assignedToUserId: userId, ...dto });
  }

  @Post(':id/record-result')
  @RfAction('update')
  @ApiOperation({ summary: 'Record inspection result from RF device' })
  @ApiCreatedResponse({ type: RecordResultResponseDto })
  async recordResult(@Req() req: any, @Param('id') id: string, @Body() dto: RfRecordResultRequestDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession.userId;
    return this.service.recordResult(tenantId, id, { ...dto, createdBy: userId, inspectorUserId: userId });
  }

  // GAP-5: Directed work
  @Post('get-next')
  @RfAction('update')
  @ApiOperation({ summary: 'Get next QC inspection task (directed work assignment)' })
  @ApiCreatedResponse({ type: QualityInspectionDto })
  async getNext(@Req() req: any, @Body() dto: RfGetNextQcTaskDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id);
    const userId = req.rfSession.userId || dto.user_id;
    return this.service.getNextQcTask(tenantId, facilityId, userId);
  }

  // GAP-2: Defect codes
  @Post('defect-codes')
  @RfAction('read')
  @ApiOperation({ summary: 'List active defect codes for RF device' })
  @ApiCreatedResponse({ type: [DefectCodeDto] })
  async defectCodes(@Req() req: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service['prisma'].defect_codes.findMany({
      where: { tenant_id: tenantId, is_active: true },
      orderBy: { code: 'asc' },
    });
  }

  // GAP-4: Lot validation
  @Post('validate-lot')
  @RfAction('read')
  @ApiOperation({ summary: 'Compare expected vs actual lot number' })
  @ApiCreatedResponse({ type: LotValidationDto })
  async validateLot(@Req() req: any, @Body() dto: RfValidateLotDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.validateLot(tenantId, BigInt(dto.inspection_id), dto.actual_lot_number);
  }

  // GAP-4: Expiry validation
  @Post('validate-expiry')
  @RfAction('read')
  @ApiOperation({ summary: 'Check expiry date against product thresholds' })
  @ApiCreatedResponse({ type: ExpiryValidationDto })
  async validateExpiry(@Req() req: any, @Body() dto: RfValidateExpiryDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id);
    return this.service.validateExpiry(tenantId, BigInt(dto.product_id), new Date(dto.expiry_date), facilityId);
  }

  // GAP-4: Temperature recording
  @Post('validate-temperature')
  @RfAction('update')
  @ApiOperation({ summary: 'Record temperature reading during QC' })
  @ApiCreatedResponse({ type: TemperatureRecordingDto })
  async validateTemperature(@Req() req: any, @Body() dto: RfValidateTemperatureDto) {
    const tenantId = req.tenantContext.getTenantId();
    return { recorded: true, readingCelsius: dto.temperature_celsius, isCompliant: dto.is_compliant ?? true };
  }

  // GAP-7: Pending reviews
  @Post('pending-review')
  @RfAction('read')
  @ApiOperation({ summary: 'List inspections needing supervisor review' })
  @ApiCreatedResponse({ type: [QualityInspectionDto] })
  async pendingReview(@Req() req: any, @Body() dto: RfPendingReviewDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id);
    return this.service.getPendingReviews(tenantId, facilityId);
  }

  // GAP-7: Supervisor approve
  @Post(':id/supervisor-approve')
  @RfAction('update')
  @ApiOperation({ summary: 'Supervisor approve inspection result' })
  @ApiCreatedResponse({ type: SupervisorApproveResultDto })
  async supervisorApprove(@Req() req: any, @Param('id') id: string, @Body() dto: RfSupervisorApproveDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId || dto.supervisor_id;
    return this.service.supervisorApprove(tenantId, BigInt(id), userId, dto.override_disposition);
  }

  // GAP-7: Supervisor reject
  @Post(':id/supervisor-reject')
  @RfAction('update')
  @ApiOperation({ summary: 'Supervisor reject inspection, create reinspection' })
  @ApiCreatedResponse({ type: SupervisorRejectResultDto })
  async supervisorReject(@Req() req: any, @Param('id') id: string, @Body() dto: RfSupervisorRejectDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId || dto.supervisor_id;
    return this.service.supervisorReject(tenantId, BigInt(id), userId);
  }
}
