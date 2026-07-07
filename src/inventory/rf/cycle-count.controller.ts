import { Controller, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse } from '@nestjs/swagger';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../common/decorators/rf-action.decorator';
import { CycleCountService } from '../counts/cycle-count.service';
import { RootCauseService } from '../counts/root-cause.service';
import {
  CycleCountResponseDto,
  SubmitLineResponseDto,
  ScanLocationResponseDto,
  VerifyItemResponseDto,
  LpnCountStartResponseDto,
  CycleCountLineResponseDto,
  CountProgressResponseDto,
  VarianceInvestigationResponseDto,
  CycleCountEventResponseDto,
  RootCauseCategoryResponseDto,
  RfCycleCountStartDto,
  RfNextCountWorkDto,
  RfCycleCountScanLocationDto,
  RfCycleCountScanLpnDto,
  RfStartLpnCountDto,
  RfEnterQtyDto,
  RfCycleCountCompleteDto,
  RfPendingReviewsDto,
  RfCycleCountRejectDto,
  RfRootCauseDto,
  RfCreateAdHocDto,
} from '../dtos/inventory-response.dto';

@ApiTags('WMS-RF')
@Controller('rf/cycle-counts')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class CycleCountRfController {
  constructor(
    private readonly service: CycleCountService,
    private readonly rootCauseService: RootCauseService,
  ) {}

  @Post('start')
  @RfAction('create')
  @ApiCreatedResponse({ type: CycleCountResponseDto })
  async start(@Req() req: any, @Body() dto: RfCycleCountStartDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, { ...dto, status: 'ASSIGNED', assignedToUserId: req.rfSession.userId });
  }

  // APP-CC-F: Get next count work (collision-safe assignment)
  @Post('next-count-work')
  @RfAction('read')
  @ApiCreatedResponse({ type: CycleCountResponseDto })
  async nextCountWork(@Req() req: any, @Body() dto: RfNextCountWorkDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id);
    const userId = req.rfSession.userId;
    return this.service.getNextCountWork(tenantId, facilityId, userId);
  }

  // APP-CC-B: Scan location with validation
  @Post('scan-location')
  @RfAction('read')
  @ApiCreatedResponse({ type: ScanLocationResponseDto })
  async scanLocation(@Req() req: any, @Body() dto: RfCycleCountScanLocationDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id);
    return this.service.scanLocationForCount(tenantId, facilityId, dto.location_barcode, dto.count_id);
  }

  @Post('scan-lpn')
  @RfAction('read')
  @ApiCreatedResponse({ type: VerifyItemResponseDto })
  async scanLpn(@Req() req: any, @Body() dto: RfCycleCountScanLpnDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id);
    return this.service.verifyItemAtLocation(tenantId, facilityId, dto.location_barcode, dto.lpn_barcode);
  }

  // GAP-7: LPN counting mode
  @Post('start-lpn')
  @RfAction('create')
  @ApiCreatedResponse({ type: LpnCountStartResponseDto })
  async startLpnCount(@Req() req: any, @Body() dto: RfStartLpnCountDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id);
    return this.service.startLpnCount(tenantId, facilityId, dto.lpn_barcode, req.rfSession.userId);
  }

  @Post('enter-qty')
  @RfAction('update')
  @ApiCreatedResponse({ type: SubmitLineResponseDto })
  async enterQty(@Req() req: any, @Body() dto: RfEnterQtyDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.submitLine(tenantId, dto.count_id, dto);
  }

  @Post('submit-line')
  @RfAction('update')
  @ApiCreatedResponse({ type: SubmitLineResponseDto })
  async submitLine(@Req() req: any, @Body() dto: RfEnterQtyDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.submitLine(tenantId, dto.count_id, dto);
  }

  // APP-CC-G: Save draft line
  @Post('save-draft')
  @RfAction('update')
  @ApiCreatedResponse({ type: CycleCountLineResponseDto })
  async saveDraft(@Req() req: any, @Body() dto: RfEnterQtyDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.saveDraftLine(tenantId, dto.count_id, { ...dto, userId: req.rfSession.userId });
  }

  @Post('complete')
  @RfAction('update')
  @ApiCreatedResponse({ type: CycleCountResponseDto })
  async complete(@Req() req: any, @Body() dto: RfCycleCountCompleteDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession.userId;
    return this.service.complete(tenantId, dto.count_id, userId);
  }

  @Post('pending-reviews')
  @RfAction('read')
  @ApiCreatedResponse({ type: [VarianceInvestigationResponseDto] })
  async pendingReviews(@Req() req: any, @Body() dto: RfPendingReviewsDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id);
    return this.service.getPendingReviews(tenantId, facilityId);
  }

  @Post(':id/approve')
  @RfAction('update')
  @ApiCreatedResponse({ type: VarianceInvestigationResponseDto })
  async approve(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId || 'system';
    return this.service.approveVariance(tenantId, BigInt(id), userId);
  }

  @Post(':id/reject')
  @RfAction('update')
  @ApiCreatedResponse({ type: VarianceInvestigationResponseDto })
  async reject(@Req() req: any, @Param('id') id: string, @Body() dto: RfCycleCountRejectDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId || 'system';
    return this.service.rejectVariance(tenantId, BigInt(id), userId, dto.reason || '');
  }

  @Post(':id/recount')
  @RfAction('update')
  @ApiCreatedResponse({ type: VarianceInvestigationResponseDto })
  async recount(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId || 'system';
    return this.service.requestRecount(tenantId, BigInt(id), userId);
  }

  @Post(':id/root-cause')
  @RfAction('update')
  @ApiCreatedResponse({ type: VarianceInvestigationResponseDto })
  async rootCause(@Req() req: any, @Param('id') id: string, @Body() dto: RfRootCauseDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.rootCauseService.assignRootCause(tenantId, BigInt(id), BigInt(dto.category_id), dto.description);
  }

  // APP-CC-K: Ad-hoc count creation from RF
  @Post('create-ad-hoc')
  @RfAction('create')
  @ApiCreatedResponse({ type: CycleCountResponseDto })
  async createAdHoc(@Req() req: any, @Body() dto: RfCreateAdHocDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.createAdHoc(tenantId, { ...dto, assignedToUserId: req.rfSession.userId });
  }

  // APP-CC-E: Get audit timeline from RF
  @Post(':id/timeline')
  @RfAction('read')
  @ApiCreatedResponse({ type: [CycleCountEventResponseDto] })
  async timeline(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.getAuditTimeline(tenantId, id);
  }
}
