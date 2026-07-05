import { Controller, Get, Post, Delete, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PackingService } from '../packing.service';

@ApiTags('Outbound - Packing')
@Controller('web/packing')
export class PackingWebController {
  constructor(private readonly service: PackingService) {}

  @Post('sessions/start')
  @ApiOperation({ summary: 'Start a packing session' })
  async startSession(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.startSession(tenantId, dto);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get packing session with slips and history' })
  async getSession(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findSessionById(tenantId, BigInt(id));
  }

  @Post('sessions/:id/assign-order')
  @ApiOperation({ summary: 'Assign order to packing session' })
  async assignOrder(@Req() req: any, @Param('id') id: string, @Body('orderId') orderId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.assignOrder(tenantId, BigInt(id), BigInt(orderId));
  }

  @Post('sessions/:id/pack')
  @ApiOperation({ summary: 'Pack items into a container and create packing slip' })
  async packItems(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.packItems(tenantId, BigInt(id), dto);
  }

  @Post('sessions/:id/complete')
  @ApiOperation({ summary: 'Complete packing session' })
  async completeSession(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.completeSession(tenantId, BigInt(id));
  }

  @Post('containers/:id/seal')
  @ApiOperation({ summary: 'Seal a packed container' })
  async sealContainer(@Req() req: any, @Param('id') id: string, @Body('sealNumber') sealNumber: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.sealContainer(tenantId, BigInt(id), sealNumber);
  }

  @Get('stations')
  @ApiOperation({ summary: 'List packing stations' })
  async getStations(@Req() req: any, @Body('facilityId') facilityId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.getStations(tenantId, BigInt(facilityId));
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Delete packing session' })
  async deleteSession(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.deleteSession(tenantId, BigInt(id));
  }
}
