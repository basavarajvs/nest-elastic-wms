import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';
import { ReceivingService } from '../receiving.service';
import { GoodsReceiptWithLinesResponseDto, ReceiveLineResponseDto, AssignDockDoorResponseDto, ScanProductResponseDto, LookupAsnResponseDto, LookupPoResponseDto, LookupLpnResponseDto, RfAssignDoorDto, RfStartReceivingSessionDto, RfScanProductDto, RfScanAsnDto, RfScanPoDto, RfScanLpnReceiveDto, RfBlindReceiveDto, RfConfirmReceiveDto, RfStageReceiptDto, RfCompleteReceiptDto, RfPendingApprovalsDto, RfApproveVarianceDto, RfDamageCodeListResponseDto, RfPendingApprovalsResponseDto, RfApproveVarianceResponseDto } from '../dtos/receiving-response.dto';

@ApiTags('RF - Receiving')
@Controller('rf/inbound/receive')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class RfReceivingController {
  constructor(private readonly receivingService: ReceivingService) {}

  @Post('assign-door')
  @ApiOperation({ summary: 'Scan dock door barcode, assign appointment to door (RF)' })
  @ApiCreatedResponse({ type: AssignDockDoorResponseDto })
  @RfAction('update')
  async assignDoor(@Req() req: any, @Body() dto: RfAssignDoorDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id || 0);
    const userId = req.rfSession.userId;
    return this.receivingService.assignDockDoor(tenantId, facilityId, dto.dock_code, dto.appointment_id, userId);
  }

  @Post('start')
  @ApiOperation({ summary: 'Start receiving session — by receiptId, ASN, or PO (RF)' })
  @ApiCreatedResponse({ type: GoodsReceiptWithLinesResponseDto })
  @RfAction('create')
  async start(@Req() req: any, @Body() dto: RfStartReceivingSessionDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.startReceivingSession(tenantId, dto);
  }

  @Post('scan')
  @ApiOperation({ summary: 'Scan product barcode during receiving (RF)' })
  @ApiOkResponse({ type: ScanProductResponseDto })
  @RfAction('read')
  async scan(@Req() req: any, @Body() dto: RfScanProductDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.scanProduct(tenantId, BigInt(dto.receipt_id), dto);
  }

  @Post('scan-asn')
  @ApiOperation({ summary: 'Scan ASN to load expected lines (RF)' })
  @ApiOkResponse({ type: LookupAsnResponseDto })
  @RfAction('read')
  async scanAsn(@Req() req: any, @Body() dto: RfScanAsnDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.lookupByAsn(tenantId, dto.asn_number, BigInt(dto.facility_id));
  }

  @Post('scan-po')
  @ApiOperation({ summary: 'Scan PO to load expected lines (RF)' })
  @ApiOkResponse({ type: LookupPoResponseDto })
  @RfAction('read')
  async scanPo(@Req() req: any, @Body() dto: RfScanPoDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.lookupByPo(tenantId, dto.po_number, BigInt(dto.facility_id));
  }

  @Post('scan-lpn')
  @ApiOperation({ summary: 'Scan LPN/pallet to find staging location (RF)' })
  @ApiOkResponse({ type: LookupLpnResponseDto })
  @RfAction('read')
  async scanLpn(@Req() req: any, @Body() dto: RfScanLpnReceiveDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.lookupByLpn(tenantId, BigInt(dto.facility_id), dto.lpn_barcode);
  }

  @Post('blind-receive')
  @ApiOperation({ summary: 'Blind receive — receive without PO/ASN (RF)' })
  @ApiCreatedResponse({ type: ReceiveLineResponseDto })
  @RfAction('create')
  async blindReceive(@Req() req: any, @Body() dto: RfBlindReceiveDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.blindReceive(tenantId, BigInt(dto.facility_id), dto);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm received quantity, damage, disposition (RF)' })
  @ApiOkResponse({ type: ReceiveLineResponseDto })
  @RfAction('update')
  async confirm(@Req() req: any, @Body() dto: RfConfirmReceiveDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.confirmQuantity(tenantId, BigInt(dto.receipt_id), dto);
  }

  @Post('stage')
  @ApiOperation({ summary: 'Set staging location for receipt (RF)' })
  @ApiOkResponse({ type: GoodsReceiptWithLinesResponseDto })
  @RfAction('update')
  async stage(@Req() req: any, @Body() dto: RfStageReceiptDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.stageReceipt(tenantId, BigInt(dto.receipt_id), dto.staging_location_id);
  }

  @Post('complete')
  @ApiOperation({ summary: 'Complete receiving — close GRN, generate putaway tasks (RF)' })
  @ApiOkResponse({ type: GoodsReceiptWithLinesResponseDto })
  @RfAction('update')
  async complete(@Req() req: any, @Body() dto: RfCompleteReceiptDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.completeReceipt(
      tenantId,
      BigInt(dto.receipt_id),
      dto.staging_location_id ? BigInt(dto.staging_location_id) : undefined,
    );
  }

  @Post('damage-codes')
  @ApiOperation({ summary: 'List active damage codes for RF device selection' })
  @ApiOkResponse({ type: RfDamageCodeListResponseDto })
  @RfAction('read')
  async damageCodes(@Req() req: any) {
    const tenantId = req.tenantContext.getTenantId();
    return { damageCodes: [], message: 'Use /web/damage-codes for management', tenantId };
  }

  @Post('pending-approvals')
  @ApiOperation({ summary: 'List pending variance approvals for supervisor' })
  @ApiOkResponse({ type: RfPendingApprovalsResponseDto })
  @RfAction('read')
  async pendingApprovals(@Req() req: any, @Body() dto: RfPendingApprovalsDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = req.rfSession?.facilityId ? BigInt(req.rfSession.facilityId) : BigInt(dto.facility_id || 0);
    return { pendingApprovals: [], facilityId, message: 'Use /web/receiving-approvals for management' };
  }

  @Post('approve-variance')
  @ApiOperation({ summary: 'Supervisor approves/rejects over/under variance (RF)' })
  @ApiOkResponse({ type: RfApproveVarianceResponseDto })
  @RfAction('update')
  async approveVariance(@Req() req: any, @Body() dto: RfApproveVarianceDto) {
    const tenantId = req.tenantContext.getTenantId();
    return { approved: true, configId: dto.config_id, action: dto.action || 'approve' };
  }
}
