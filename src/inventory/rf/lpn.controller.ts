import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../common/decorators/rf-action.decorator';
import { LpnService } from '../lpn/lpn.service';

@ApiTags('WMS-RF')
@Controller('rf/lpn')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class LpnRfController {
  constructor(private readonly service: LpnService) {}

  @Post('lookup')
  @RfAction('read')
  async lookup(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findByBarcode(tenantId, dto.barcode);
  }

  @Post('move')
  @RfAction('update')
  async move(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession.userId;
    return this.service.moveLpn(tenantId, dto.lpnId, dto.newLocationId, userId);
  }
}
