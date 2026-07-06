import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ShipmentService } from '../shipment.service';
import { LoadService } from '../../loads/load.service';

@ApiTags('Outbound - Shipments')
@Controller('web/shipments')
export class ShipmentWebController {
  constructor(
    private readonly service: ShipmentService,
    private readonly loadService: LoadService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create outbound shipment' })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List shipments' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shipment with items, labels, history' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findShipmentById(tenantId, BigInt(id));
  }

  @Post(':id/assign-carrier')
  @ApiOperation({ summary: 'Assign carrier to shipment' })
  async assignCarrier(@Req() req: any, @Param('id') id: string, @Body('carrierId') carrierId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.assignCarrier(tenantId, BigInt(id), BigInt(carrierId));
  }

  @Post(':id/stage')
  @ApiOperation({ summary: 'Stage shipment at dock door' })
  async stage(@Req() req: any, @Param('id') id: string, @Body('stagingLocationId') stagingLocationId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.stageShipment(tenantId, BigInt(id), BigInt(stagingLocationId));
  }

  @Post(':id/load')
  @ApiOperation({ summary: 'Load shipment onto vehicle/load' })
  async load(@Req() req: any, @Param('id') id: string, @Body('loadId') loadId?: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.loadShipment(tenantId, BigInt(id), loadId ? BigInt(loadId) : undefined);
  }

  @Post(':id/ship')
  @ApiOperation({ summary: 'Confirm shipment as shipped, generate label' })
  async ship(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.shipShipment(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete shipment' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }

  // GAP-9: Close shipment from web
  @Post(':id/close')
  @ApiOperation({ summary: 'Close shipment from web' })
  async close(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.closeShipment(tenantId, BigInt(id), dto?.force);
  }

  // APP-SHIP-D: Shipping audit timeline for a load
  @Get('audit/shipping/:loadId')
  @ApiOperation({ summary: 'Get shipping audit timeline for a load' })
  async auditTimeline(@Req() req: any, @Param('loadId') loadId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.getShippingAuditTimeline(tenantId, BigInt(loadId));
  }

  // APP-SHIP-D: Carton lifecycle audit
  @Get('audit/carton/:cartonId')
  @ApiOperation({ summary: 'Get carton lifecycle audit from pack to ship' })
  async cartonAudit(@Req() req: any, @Param('cartonId') cartonId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.getCartonAuditTimeline(tenantId, BigInt(cartonId));
  }
}
