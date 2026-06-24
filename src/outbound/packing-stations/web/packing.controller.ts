import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { PackingService } from '../packing.service';
import { StartSessionDto, ScanItemDto, SealContainerDto, CloseSessionDto } from '../dtos/packing.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/packing')
@UseGuards(CaslGuard)
export class PackingWebController {
  constructor(private readonly packingService: PackingService) {}

  @Post('sessions/start')
  @CheckAbility({ action: 'create', subject: 'PackingSession' })
  @ApiOperation({ summary: 'Start a packing session' })
  async startSession(@Body() dto: StartSessionDto, @Req() req: any) {
    return this.packingService.startSession(dto, req.user?.id || '00000000-0000-0000-0000-000000000000', req.tenantContext.getTenantId());
  }

  @Post('sessions/:id/scan-item')
  @CheckAbility({ action: 'update', subject: 'PackingSession' })
  @ApiOperation({ summary: 'Scan item into container' })
  async scanItem(@Param('id') id: string, @Body() dto: ScanItemDto, @Req() req: any) {
    return this.packingService.scanItem(id, req.user?.id || '00000000-0000-0000-0000-000000000000', req.tenantContext.getTenantId(), dto);
  }

  @Post('sessions/:id/seal-container')
  @CheckAbility({ action: 'update', subject: 'PackingSession' })
  @ApiOperation({ summary: 'Seal active container and create new one' })
  async sealContainer(@Param('id') id: string, @Body() dto: SealContainerDto, @Req() req: any) {
    return this.packingService.sealContainer(id, req.tenantContext.getTenantId(), dto);
  }

  @Post('sessions/:id/close')
  @CheckAbility({ action: 'update', subject: 'PackingSession' })
  @ApiOperation({ summary: 'Close a packing session' })
  async closeSession(@Param('id') id: string, @Req() req: any) {
    return this.packingService.closeSession(id, req.user?.id || '00000000-0000-0000-0000-000000000000', req.tenantContext.getTenantId());
  }

  @Get('sessions/:id/history')
  @CheckAbility({ action: 'read', subject: 'PackingSession' })
  @ApiOperation({ summary: 'Get session status history' })
  async getHistory(@Param('id') id: string, @Req() req: any) {
    return this.packingService.getStatusHistory(id, req.tenantContext.getTenantId());
  }

  @Get('sessions/:id/containers')
  @CheckAbility({ action: 'read', subject: 'PackingSession' })
  @ApiOperation({ summary: 'List containers in session' })
  async getContainers(@Param('id') id: string, @Req() req: any) {
    return this.packingService.getContainers(id, req.tenantContext.getTenantId());
  }

  @Get('shipments/:id/status-history')
  @CheckAbility({ action: 'read', subject: 'OutboundShipment' })
  @ApiOperation({ summary: 'Get shipment status timeline' })
  async getShipmentHistory(@Param('id') id: string, @Req() req: any) {
    return this.packingService.getShipmentStatusHistory(id, req.tenantContext.getTenantId());
  }
}
