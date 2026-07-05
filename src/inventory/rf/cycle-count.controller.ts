import { Controller, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../common/decorators/rf-action.decorator';
import { CycleCountService } from '../counts/cycle-count.service';

@ApiTags('WMS-RF')
@Controller('rf/cycle-counts')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class CycleCountRfController {
  constructor(private readonly service: CycleCountService) {}

  @Post('start')
  @RfAction('create')
  async start(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, { ...dto, status: 'IN_PROGRESS', userId: req.rfSession.userId });
  }

  @Post('scan-location')
  @RfAction('read')
  async scanLocation(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    return this.service.scanLocationForCount(tenantId, facilityId, dto.locationBarcode || dto.locationCode);
  }

  @Post('scan-lpn')
  @RfAction('read')
  async scanLpn(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    return this.service.verifyItemAtLocation(tenantId, facilityId, dto.locationBarcode, dto.lpnBarcode);
  }

  @Post('enter-qty')
  @RfAction('update')
  async enterQty(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.submitLine(tenantId, dto.countId, dto);
  }

  @Post('submit-line')
  @RfAction('update')
  async submitLine(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.submitLine(tenantId, dto.countId, dto);
  }

  @Post('complete')
  @RfAction('update')
  async complete(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession.userId;
    return this.service.complete(tenantId, dto.countId, userId);
  }
}
