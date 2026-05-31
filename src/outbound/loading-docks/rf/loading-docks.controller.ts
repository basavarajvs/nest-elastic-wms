import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { LoadingDocksService } from '../loading-docks.service';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfAction } from '../../../common/guards/rf-action.decorator';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';

@ApiTags('WMS-RF')
@Controller('rf/loading-docks')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class LoadingDocksRfController {
  constructor(private readonly service: LoadingDocksService) {}

  @Get('/available')
  @RfAction('read')
  async getAvailableDocks(@Req() req: any) {
    const tenantId = req.tenantContext.getTenantId();
    const all = await this.service.findAll(tenantId);
    return all.filter((d: any) => d.isAvailable && d.isActive);
  }

  @Post('/:id/assign')
  @RfAction('update')
  async assignDock(@Param('id') id: string, @Req() req: any) {
    return this.service.update(id, { isAvailable: false }, req.tenantContext.getTenantId());
  }

  @Post('/:id/release')
  @RfAction('update')
  async releaseDock(@Param('id') id: string, @Req() req: any) {
    return this.service.update(id, { isAvailable: true }, req.tenantContext.getTenantId());
  }
}
