import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../common/decorators/rf-action.decorator';
import { DockYardService } from '../dock-yard.service';

@ApiTags('WMS-RF')
@Controller('rf/dock-appointments')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class DockYardRfController {
  constructor(private readonly service: DockYardService) {}

  @Post('upcoming')
  @RfAction('read')
  @ApiOperation({ summary: 'List upcoming dock appointments (RF)' })
  async upcoming(@Req() req: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId);
    return this.service.getUpcomingAppointments(tenantId, facilityId);
  }
}
