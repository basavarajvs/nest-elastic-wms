import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse } from '@nestjs/swagger';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../common/decorators/rf-action.decorator';
import { LpnService } from '../lpn/lpn.service';
import { LpnResponseDto, RfLpnLookupDto, RfLpnMoveDto } from '../dtos/inventory-response.dto';

@ApiTags('WMS-RF')
@Controller('rf/lpn')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class LpnRfController {
  constructor(private readonly service: LpnService) {}

  @Post('lookup')
  @RfAction('read')
  @ApiCreatedResponse({ type: LpnResponseDto })
  async lookup(@Req() req: any, @Body() dto: RfLpnLookupDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findByBarcode(tenantId, dto.barcode);
  }

  @Post('move')
  @RfAction('update')
  @ApiCreatedResponse({ type: LpnResponseDto })
  async move(@Req() req: any, @Body() dto: RfLpnMoveDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession.userId;
    return this.service.moveLpn(tenantId, dto.lpn_id, dto.new_location_id, userId);
  }
}
