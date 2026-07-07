import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { InboundTrailerService } from '../trailer.service';
import { TrailerDto, RfTrailerCheckInDto, RfTrailerAssignDoorDto, RfTrailerDepartDto } from '../dtos/trailer-response.dto';

@ApiTags('RF - Inbound Trailers')
@Controller('rf/inbound/trailer')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class RfInboundTrailerController {
  constructor(private readonly trailerService: InboundTrailerService) {}

  @Post('check-in')
  @ApiOperation({ summary: 'RF Check-in trailer - scan/enter trailer number' })
  @ApiCreatedResponse({ type: TrailerDto })
  @RfAction('create')
  async checkIn(@Req() req: any, @Body() dto: RfTrailerCheckInDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = req.rfSession?.facilityId ? BigInt(req.rfSession.facilityId) : BigInt(dto.facility_id || 0);
    return this.trailerService.checkIn(tenantId, facilityId, dto);
  }

  @Post('assign-door')
  @ApiOperation({ summary: 'RF Assign trailer to dock door' })
  @ApiOkResponse({ type: TrailerDto })
  @RfAction('update')
  async assignDoor(@Req() req: any, @Body() dto: RfTrailerAssignDoorDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = req.rfSession?.facilityId ? BigInt(req.rfSession.facilityId) : BigInt(dto.facility_id || 0);
    return this.trailerService.assignDock(tenantId, facilityId, BigInt(dto.trailer_id), dto.dock_code);
  }

  @Post('depart')
  @ApiOperation({ summary: 'RF Depart trailer after unloading' })
  @ApiOkResponse({ type: TrailerDto })
  @RfAction('update')
  async depart(@Req() req: any, @Body() dto: RfTrailerDepartDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.trailerService.depart(tenantId, BigInt(dto.trailer_id));
  }
}
