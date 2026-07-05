import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { FacilityService } from '../facility.service';

@ApiTags('WMS-RF Facilities')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
@Controller('rf/facilities')
export class RfFacilityController {
  constructor(private readonly facilityService: FacilityService) {}

  @Post('current')
  @RfAction('read')
  @ApiOperation({ summary: 'RF: Get current facility info' })
  async current(@Req() req: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = req.rfSession?.facilityId;
    if (!facilityId) {
      return { facility: null, message: 'No facility selected in RF session' };
    }
    const facility = await this.facilityService.findById(tenantId, BigInt(facilityId));
    return { facility };
  }
}
