import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { PackingStationsService } from '../packing-stations.service';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfAction } from '../../../common/guards/rf-action.decorator';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';

@ApiTags('WMS-RF')
@Controller('rf/packing-stations')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class PackingStationsRfController {
  constructor(private readonly service: PackingStationsService) {}

  @Get('/available')
  @RfAction('read')
  async getAvailableStations(@Req() req: any) {
    return this.service.findAll(req.tenantContext.getTenantId());
  }

  @Get('/:stationCode')
  @RfAction('read')
  async getStation(@Param('stationCode') stationCode: string, @Req() req: any) {
    const stations = await this.service.findAll(req.tenantContext.getTenantId());
    const station = stations.find((s: any) => s.stationCode === stationCode);
    if (!station) return { error: 'Station not found' };
    return { stationCode: station.stationCode, isAvailable: station.isAvailable, isActive: station.isActive };
  }
}
