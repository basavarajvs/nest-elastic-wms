import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { DockYardService } from '../dock-yard.service';

@ApiTags('WMS-RF', 'Dock & Yard')
@Controller('rf/dock-appointments')
@UseGuards(RfSessionGuard)
export class DockYardRfController {
  constructor(private readonly service: DockYardService) {}

  @Get('upcoming')
  @ApiOperation({ summary: 'Get today\'s upcoming appointments' })
  async getUpcoming(@Req() req: any, @Query('facilityId') facilityId: string) {
    return this.service.getUpcoming(req.tenantContext.getTenantId(), facilityId);
  }
}
