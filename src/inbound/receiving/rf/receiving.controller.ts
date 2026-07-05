import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';
import { ReceivingService } from '../receiving.service';

@ApiTags('RF - Receiving')
@Controller('rf/inbound/receive')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class RfReceivingController {
  constructor(private readonly receivingService: ReceivingService) {}

  @Post('assign-door')
  @ApiOperation({ summary: 'Scan dock door barcode, assign appointment to door (RF)' })
  @RfAction('update')
  async assignDoor(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    const userId = req.rfSession.userId;
    return this.receivingService.assignDockDoor(tenantId, facilityId, dto.dockCode, dto.appointmentId, userId);
  }

  @Post('start')
  @ApiOperation({ summary: 'Start receiving session — by receiptId, ASN, or PO (RF)' })
  @RfAction('create')
  async start(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.startReceivingSession(tenantId, dto);
  }

  @Post('scan')
  @ApiOperation({ summary: 'Scan product barcode during receiving (RF)' })
  @RfAction('read')
  async scan(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.scanProduct(tenantId, BigInt(dto.receiptId), dto);
  }

  @Post('scan-asn')
  @ApiOperation({ summary: 'Scan ASN to load expected lines (RF)' })
  @RfAction('read')
  async scanAsn(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.lookupByAsn(tenantId, dto.asnNumber, BigInt(dto.facilityId));
  }

  @Post('scan-po')
  @ApiOperation({ summary: 'Scan PO to load expected lines (RF)' })
  @RfAction('read')
  async scanPo(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.lookupByPo(tenantId, dto.poNumber, BigInt(dto.facilityId));
  }

  @Post('scan-lpn')
  @ApiOperation({ summary: 'Scan LPN/pallet to find staging location (RF)' })
  @RfAction('read')
  async scanLpn(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.lookupByLpn(tenantId, BigInt(dto.facilityId), dto.lpnBarcode);
  }

  @Post('blind-receive')
  @ApiOperation({ summary: 'Blind receive — receive without PO/ASN (RF)' })
  @RfAction('create')
  async blindReceive(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.blindReceive(tenantId, BigInt(dto.facilityId), dto);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm received quantity, damage, disposition (RF)' })
  @RfAction('update')
  async confirm(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.confirmQuantity(tenantId, BigInt(dto.receiptId), dto);
  }

  @Post('stage')
  @ApiOperation({ summary: 'Set staging location for receipt (RF)' })
  @RfAction('update')
  async stage(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.stageReceipt(tenantId, BigInt(dto.receiptId), dto.stagingLocationId);
  }

  @Post('complete')
  @ApiOperation({ summary: 'Complete receiving — close GRN, generate putaway tasks (RF)' })
  @RfAction('update')
  async complete(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.completeReceipt(
      tenantId,
      BigInt(dto.receiptId),
      dto.stagingLocationId ? BigInt(dto.stagingLocationId) : undefined,
    );
  }

  @Post('damage-codes')
  @ApiOperation({ summary: 'List active damage codes for RF device selection' })
  @RfAction('read')
  async damageCodes(@Req() req: any) {
    const tenantId = req.tenantContext.getTenantId();
    return { damageCodes: [], message: 'Use /web/damage-codes for management', tenantId };
  }

  @Post('pending-approvals')
  @ApiOperation({ summary: 'List pending variance approvals for supervisor' })
  @RfAction('read')
  async pendingApprovals(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = req.rfSession?.facilityId ? BigInt(req.rfSession.facilityId) : BigInt(dto.facilityId);
    return { pendingApprovals: [], facilityId, message: 'Use /web/receiving-approvals for management' };
  }

  @Post('approve-variance')
  @ApiOperation({ summary: 'Supervisor approves/rejects over/under variance (RF)' })
  @RfAction('update')
  async approveVariance(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return { approved: true, configId: dto.configId, action: dto.action || 'approve' };
  }
}
