import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { PackingService } from '../packing.service';
import { ScanItemDto, SealContainerDto } from '../dtos/packing.dto';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfAction } from '../../../common/guards/rf-action.decorator';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';

@ApiTags('WMS-RF')
@Controller('rf/packing')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class PackingRfController {
  constructor(private readonly packingService: PackingService) {}

  @Get('sessions/my-active')
  @RfAction('read')
  async getMyActiveSession(@Req() req: any) {
    return this.packingService.getMyActiveSession(req.user?.id, req.tenantContext.getTenantId());
  }

  @Post('sessions/:id/scan-item')
  @RfAction('update')
  async scanItem(@Param('id') id: string, @Body() dto: ScanItemDto, @Req() req: any) {
    return this.packingService.scanItem(id, req.user?.id, req.tenantContext.getTenantId(), dto);
  }

  @Post('sessions/:id/seal-container')
  @RfAction('update')
  async sealContainer(@Param('id') id: string, @Body() dto: SealContainerDto, @Req() req: any) {
    return this.packingService.sealContainer(id, req.tenantContext.getTenantId(), dto);
  }
}
