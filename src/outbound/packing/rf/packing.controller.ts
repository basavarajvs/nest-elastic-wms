import { Controller, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';
import { PackingService } from '../packing.service';
import { ScaleIntegrationService } from '../scale-integration.service';

@ApiTags('RF - Packing')
@Controller('rf/outbound/pack')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class RfPackingController {
  constructor(
    private readonly packingService: PackingService,
    private readonly scaleService: ScaleIntegrationService,
  ) {}

  @Post('start')
  @ApiOperation({ summary: 'Start packing session at station (RF)' })
  @RfAction('create')
  async start(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.packingService.startSession(tenantId, {
      facilityId: dto.facilityId,
      userId: dto.userId,
      stationId: dto.stationId,
      orderId: dto.orderId,
    });
  }

  @Post('scan-order')
  @ApiOperation({ summary: 'Scan order barcode to assign to session (RF)' })
  @RfAction('read')
  async scanOrder(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const session = await this.packingService.assignOrder(tenantId, BigInt(dto.sessionId), BigInt(dto.orderId));
    return { success: true, session, orderVerified: true };
  }

  @Post('scan-item')
  @ApiOperation({ summary: 'Scan product barcode to verify packed item (RF)' })
  @RfAction('read')
  async scanItem(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const product = await this.packingService.verifyProduct(tenantId, dto.productCode, BigInt(dto.orderId));
    if (!product) return { success: false, message: 'Product not found or not on order' };
    return { success: true, product, productVerified: true };
  }

  @Post('pack')
  @ApiOperation({ summary: 'Pack scanned items into container (RF)' })
  @RfAction('create')
  async pack(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.packingService.packItems(tenantId, BigInt(dto.sessionId), {
      orderId: dto.orderId,
      packingSlipNumber: dto.packingSlipNumber,
      containerCode: dto.containerCode,
      containerType: dto.containerType || 'BOX',
      sealNumber: dto.sealNumber,
      weight: dto.weight,
      items: dto.items || [],
    });
  }

  @Post('seal')
  @ApiOperation({ summary: 'Seal container with seal number (RF)' })
  @RfAction('update')
  async seal(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.packingService.sealContainer(tenantId, BigInt(dto.containerId), dto.sealNumber);
  }

  @Post('close-carton')
  @ApiOperation({ summary: 'Close carton — generate shipping LPN, print label data (RF)' })
  @RfAction('create')
  async closeCarton(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    return this.packingService.closeCarton(tenantId, facilityId, BigInt(dto.sessionId), dto);
  }

  @Post('complete')
  @ApiOperation({ summary: 'Complete packing session (RF)' })
  @RfAction('update')
  async complete(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.packingService.completeSession(tenantId, BigInt(dto.sessionId));
  }

  @Post('my-session')
  @ApiOperation({ summary: 'Get current packing session for user (RF)' })
  @RfAction('read')
  async mySession(@Req() req: any, @Body('userId') userId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.packingService.findSessionByUser(tenantId, userId);
  }

  @Post('get-next')
  @ApiOperation({ summary: 'Get next packing work (directed assignment)' })
  @RfAction('read')
  async getNext(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    const userId = req.rfSession?.userId || dto.userId;
    const sessionId = dto.sessionId ? BigInt(dto.sessionId) : undefined;
    return this.packingService.getNextPackWork(tenantId, facilityId, BigInt(dto.stationId || 0), userId, sessionId);
  }

  @Post('nest-lpn')
  @ApiOperation({ summary: 'Nest pick LPN into carton LPN' })
  @RfAction('update')
  async nestLpn(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.packingService.nestPickLpn(tenantId, BigInt(dto.cartonLpnId), BigInt(dto.pickLpnId));
  }

  @Post('report-shortage')
  @ApiOperation({ summary: 'Report shortage during packing' })
  @RfAction('update')
  async reportShortage(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    return this.packingService.reportShortage(tenantId, facilityId, BigInt(dto.sessionId), dto);
  }

  @Post('report-damage')
  @ApiOperation({ summary: 'Report damage during packing' })
  @RfAction('update')
  async reportDamage(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    return this.packingService.reportPackingDamage(tenantId, facilityId, BigInt(dto.sessionId), dto);
  }

  @Post('pending-exceptions')
  @ApiOperation({ summary: 'List pending supervisor exceptions' })
  @RfAction('read')
  async pendingExceptions(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    return this.packingService.getPendingExceptions(tenantId, facilityId);
  }

  @Post(':exceptionId/approve')
  @ApiOperation({ summary: 'Supervisor approve exception' })
  @RfAction('update')
  async approveException(@Req() req: any, @Param('exceptionId') exceptionId: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId || dto.supervisorId;
    return this.packingService.approveException(tenantId, BigInt(exceptionId), userId);
  }

  @Post(':exceptionId/reject')
  @ApiOperation({ summary: 'Supervisor reject exception' })
  @RfAction('update')
  async rejectException(@Req() req: any, @Param('exceptionId') exceptionId: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId || dto.supervisorId;
    return this.packingService.rejectException(tenantId, BigInt(exceptionId), userId);
  }

  @Post('verify-carton')
  @ApiOperation({ summary: 'Verify carton contents before close (GAP-3)' })
  @RfAction('read')
  async verifyCarton(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.packingService.verifyCartonContents(tenantId, BigInt(dto.cartonLpnId), BigInt(dto.orderId));
  }

  @Post('capture-weight')
  @ApiOperation({ summary: 'Capture weight from scale (GAP-4)' })
  @RfAction('read')
  async captureWeight(@Req() req: any, @Body() dto: any) {
    // APP-PACK-I: Use scale integration service instead of hardcoded value
    const reading = await this.scaleService.captureWeight();
    return { weightKg: reading.weightKg, isStable: reading.isStable, unit: reading.unit, timestamp: reading.timestamp.toISOString() };
  }

  @Post('confirm-weight')
  @ApiOperation({ summary: 'Confirm weight reading (GAP-4)' })
  @RfAction('update')
  async confirmWeight(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    const result = await this.packingService.validateWeightTolerance(tenantId, BigInt(dto.orderId), Number(dto.weightKg), Number(dto.tolerancePct || 10));
    return { success: result.isWithinTolerance, ...result };
  }

  @Post('print-packing-slip')
  @ApiOperation({ summary: 'Print packing slip for current carton (GAP-8)' })
  @RfAction('read')
  async printPackingSlip(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.packingService.generatePackingSlipData(tenantId, BigInt(dto.slipId));
  }

  @Post('damage-codes')
  @ApiOperation({ summary: 'List packing damage codes (APP-PACK-F)' })
  @RfAction('read')
  async damageCodes(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.packingService.getDamageCodes(tenantId);
  }

  @Post('validate-tote')
  @ApiOperation({ summary: 'Validate tote LPN is assigned to session (APP-PACK-D)' })
  @RfAction('read')
  async validateTote(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.packingService.validateToteForSession(tenantId, BigInt(dto.pickLpnId), BigInt(dto.sessionId));
  }

  @Post('request-carton-override')
  @ApiOperation({ summary: 'Request alternate carton type (APP-PACK-C)' })
  @RfAction('update')
  async requestCartonOverride(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    return this.packingService.requestCartonOverride(tenantId, facilityId, BigInt(dto.sessionId), dto);
  }

  @Post('report-wrong-item')
  @ApiOperation({ summary: 'Report wrong item during packing (APP-PACK-G)' })
  @RfAction('update')
  async reportWrongItem(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    return this.packingService.reportWrongItem(tenantId, facilityId, BigInt(dto.sessionId), BigInt(dto.orderId), BigInt(dto.productId), BigInt(dto.pickTaskId), dto.reasonCode);
  }

  @Post('request-tracking-number')
  @ApiOperation({ summary: 'Request tracking number from carrier API (APP-PACK-H)' })
  @RfAction('update')
  async requestTrackingNumber(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.packingService.requestTrackingNumber(tenantId, BigInt(dto.shipmentId), dto.carrierId ? BigInt(dto.carrierId) : undefined);
  }
}
