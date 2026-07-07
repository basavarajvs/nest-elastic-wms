import { Controller, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { AuditLog } from '../../../common/decorators/audit-log.decorator';
import { VasCatalogService } from '../vas-catalog.service';
import { RfFindAllWorkstationsDto, RfFindAllWorkstationsResponseDto, RfCheckInWorkstationResponseDto, RfCheckOutWorkstationResponseDto } from '../dtos/response.dto';

@ApiTags('RF - VAS Catalog')
@Controller('rf/vas/workstations')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class RfVasCatalogController {
  constructor(private readonly service: VasCatalogService) {}

  @Post()
  @ApiCreatedResponse({ type: RfFindAllWorkstationsResponseDto })
  @RfAction('read')
  @ApiOperation({ summary: 'List workstations (RF)' })
  async findAll(@Req() req: any, @Body() dto: RfFindAllWorkstationsDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAllWorkstations(tenantId, dto);
  }

  @Post(':id/check-in')
  @ApiCreatedResponse({ type: RfCheckInWorkstationResponseDto })
  @RfAction('create')
  @AuditLog({ eventType: 'VAS_WORKSTATION_CHECK_IN', detail: (req) => `Check-in workstation ${req.params.id}` })
  @ApiOperation({ summary: 'Check in to workstation (RF)' })
  async checkIn(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId || req.user?.sub;
    return this.service.checkInWorkstation(tenantId, BigInt(id), userId);
  }

  @Post(':id/check-out')
  @ApiCreatedResponse({ type: RfCheckOutWorkstationResponseDto })
  @RfAction('delete')
  @AuditLog({ eventType: 'VAS_WORKSTATION_CHECK_OUT', detail: (req) => `Check-out workstation ${req.params.id}` })
  @ApiOperation({ summary: 'Check out of workstation (RF)' })
  async checkOut(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId || req.user?.sub;
    return this.service.checkOutWorkstation(tenantId, BigInt(id), userId);
  }
}
