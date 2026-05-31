import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { LpnService } from '../lpn.service';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfAction } from '../../../common/guards/rf-action.decorator';

@ApiTags('RF')
@Controller('rf/lpns')
@UseGuards(RfSessionGuard)
export class LpnRfController {
  constructor(private readonly lpnService: LpnService) {}

  @Get('inquiry/:lpnNumber')
  @RfAction('read')
  @ApiOperation({ summary: 'RF LPN inquiry by number' })
  async inquiry(@Req() req: any, @Param('lpnNumber') lpnNumber: string) {
    const lpn = await this.lpnService.findByNumber(lpnNumber, req.tenantContext.getTenantId());
    return {
      lpnNumber: lpn.lpnNumber,
      lpnType: lpn.lpnType,
      status: lpn.status,
      productId: lpn.productId,
      quantity: lpn.quantity,
      locationId: lpn.locationId,
      lotNumber: lpn.lotNumber,
      parentLpnId: lpn.parentLpnId,
      childrenCount: lpn.children?.length || 0,
    };
  }

  @Post(':id/move')
  @RfAction('update')
  @ApiOperation({ summary: 'RF move LPN to location' })
  async move(@Req() req: any, @Param('id') id: string, @Body('locationId') locationId: string) {
    return this.lpnService.moveLpn(id, locationId, req.tenantContext.getTenantId());
  }

  @Get('by-location/:locationId')
  @RfAction('read')
  async findByLocation(@Req() req: any, @Param('locationId') locationId: string) {
    const lpns = await this.lpnService.findByLocation(locationId, req.tenantContext.getTenantId());
    return lpns.map((l: any) => ({
      lpnNumber: l.lpnNumber,
      lpnType: l.lpnType,
      status: l.status,
      quantity: l.quantity,
      productId: l.productId,
    }));
  }

  @Get('product/:productId/available-quantity')
  @RfAction('read')
  async productQty(
    @Req() req: any,
    @Param('productId') productId: string,
    @Query('facilityId') facilityId: string,
  ) {
    return this.lpnService.findProductAvailableQuantity(productId, facilityId, req.tenantContext.getTenantId());
  }
}
