import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { VasCatalogService } from '../vas-catalog.service';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../../common/guards/rf-action.decorator';

@ApiTags('WMS-RF')
@Controller('rf/vas')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class VasCatalogRfController {
  constructor(private readonly service: VasCatalogService) {}

  @Get('workstations')
  @RfAction('read')
  @ApiOperation({ summary: 'RF: List available workstations' })
  async listWorkstations(@Req() req: any) {
    return this.service.listWorkstations(req.tenantContext.getTenantId(), { isAvailable: 'true' });
  }

  @Post('workstations/:id/check-in')
  @RfAction('update')
  @ApiOperation({ summary: 'RF: Check in to a workstation' })
  async checkIn(@Param('id') id: string, @Req() req: any) {
    return this.service.updateWorkstation(id, { isAvailable: false }, req.tenantContext.getTenantId());
  }

  @Post('workstations/:id/check-out')
  @RfAction('update')
  @ApiOperation({ summary: 'RF: Check out of a workstation' })
  async checkOut(@Param('id') id: string, @Req() req: any) {
    return this.service.updateWorkstation(id, { isAvailable: true }, req.tenantContext.getTenantId());
  }
}
