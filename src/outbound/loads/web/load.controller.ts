import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LoadService } from '../load.service';

@ApiTags('Outbound - Loads')
@Controller('web/loads')
export class LoadWebController {
  constructor(private readonly service: LoadService) {}

  @Post()
  @ApiOperation({ summary: 'Create load' })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List loads' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get load with shipments' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, BigInt(id));
  }

  @Post(':id/assign-shipment')
  @ApiOperation({ summary: 'Assign shipment to load' })
  async assignShipment(@Req() req: any, @Param('id') id: string, @Body('shipmentId') shipmentId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.assignShipment(tenantId, BigInt(id), BigInt(shipmentId));
  }

  @Post(':id/remove-shipment')
  @ApiOperation({ summary: 'Remove shipment from load' })
  async removeShipment(@Req() req: any, @Param('id') id: string, @Body('shipmentId') shipmentId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.removeShipment(tenantId, BigInt(id), BigInt(shipmentId));
  }

  @Post(':id/start-loading')
  @ApiOperation({ summary: 'Start loading at dock door' })
  async startLoading(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.startLoading(tenantId, BigInt(id));
  }

  @Post(':id/complete-loading')
  @ApiOperation({ summary: 'Complete loading, record BOL info' })
  async completeLoading(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.completeLoading(tenantId, BigInt(id), dto);
  }

  @Post(':id/depart')
  @ApiOperation({ summary: 'Depart load — mark as departed' })
  async depart(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.departLoad(tenantId, BigInt(id));
  }

  @Get(':id/bol')
  @ApiOperation({ summary: 'Generate BOL document data' })
  async generateBol(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.generateBol(tenantId, BigInt(id));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete load' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }

  // GAP-4: Multi-stop configuration
  @Post(':id/stops')
  @ApiOperation({ summary: 'Create a load stop' })
  async createStop(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.createStop(tenantId, BigInt(id), dto);
  }

  @Get(':id/stops')
  @ApiOperation({ summary: 'List load stops' })
  async listStops(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.getLoadingSequence(tenantId, BigInt(id));
  }

  @Post(':id/apply-route')
  @ApiOperation({ summary: 'Apply route template to create stops' })
  async applyRoute(@Req() req: any, @Param('id') id: string, @Body('routeId') routeId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.createLoadStopsFromRoute(tenantId, BigInt(id), BigInt(routeId));
  }

  // GAP-8: View manifest from web
  @Get(':id/manifest')
  @ApiOperation({ summary: 'View manifest for load' })
  async viewManifest(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.generateBol(tenantId, BigInt(id));
  }
}
