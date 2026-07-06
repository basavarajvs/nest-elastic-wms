import { Controller, Get, Post, Delete, Patch, Body, Param, Req, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PackingService } from '../packing.service';
import { CartonizationService } from '../cartonization.service';
import { PrismaService } from '../../../prisma/prisma.service';

@ApiTags('Outbound - Packing')
@Controller('web/packing')
export class PackingWebController {
  constructor(
    private readonly service: PackingService,
    private readonly cartonizationService: CartonizationService,
    private readonly prisma: PrismaService,
  ) {}

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
  async getStations(@Req() req: any, @Query('facilityId') facilityId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.getStations(tenantId, BigInt(facilityId));
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Delete packing session' })
  async deleteSession(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.deleteSession(tenantId, BigInt(id));
  }

  // GAP-7.2: Web exception management
  @Get('exceptions')
  @ApiOperation({ summary: 'List packing exceptions (GAP-7.2)' })
  async getExceptions(@Req() req: any, @Query('facilityId') facilityId: string, @Query('status') status?: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.getExceptions(tenantId, BigInt(facilityId), status);
  }

  @Patch('exceptions/:id/approve')
  @ApiOperation({ summary: 'Approve packing exception (GAP-7.2)' })
  async approveException(@Req() req: any, @Param('id') id: string, @Body('supervisorId') supervisorId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.approveException(tenantId, BigInt(id), supervisorId);
  }

  @Patch('exceptions/:id/reject')
  @ApiOperation({ summary: 'Reject packing exception (GAP-7.2)' })
  async rejectException(@Req() req: any, @Param('id') id: string, @Body('supervisorId') supervisorId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.rejectException(tenantId, BigInt(id), supervisorId);
  }

  // GAP-8.3: Web packing slip view
  @Get('packing-slips/:orderId')
  @ApiOperation({ summary: 'View packing slips by order (GAP-8.3)' })
  async getPackingSlips(@Req() req: any, @Param('orderId') orderId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.getPackingSlipsByOrder(tenantId, BigInt(orderId));
  }

  // GAP-7.2: List sessions (web)
  @Get('sessions')
  @ApiOperation({ summary: 'List packing sessions (GAP-7.2)' })
  async listSessions(@Req() req: any, @Query('facilityId') facilityId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.getSessions(tenantId, BigInt(facilityId));
  }

  // GAP-2.5: Cartonize order
  @Post('cartonize/:orderId')
  @ApiOperation({ summary: 'Calculate carton plan for order (GAP-2)' })
  async cartonizeOrder(@Req() req: any, @Param('orderId') orderId: string, @Query('facilityId') facilityId: string) {
    const tenantId = req.tenantContext.getTenantId();
    const result = await this.cartonizationService.calculateCartons(tenantId, BigInt(facilityId), BigInt(orderId));
    if (result.cartons.length) {
      await this.cartonizationService.createCartonPlan(tenantId, BigInt(facilityId), BigInt(orderId), result.cartons);
    }
    return result;
  }

  // APP-PACK-A: Shipment packing status
  @Get('shipments/:shipmentId/packing-status')
  @ApiOperation({ summary: 'Get shipment packing status — which cartons are packed vs pending (APP-PACK-A)' })
  async getShipmentPackingStatus(@Req() req: any, @Param('shipmentId') shipmentId: string) {
    const tenantId = req.tenantContext.getTenantId();
    const shipment = await this.prisma.outbound_shipments.findFirst({ where: { tenant_id: tenantId, shipment_id: BigInt(shipmentId) } });
    if (!shipment) throw new NotFoundException('Shipment not found');
    const plans = await this.prisma.packing_carton_plan.findMany({
      where: { tenant_id: tenantId, order_id: shipment.order_id || undefined },
      orderBy: { carton_index: 'asc' },
    });
    return {
      shipmentId: shipment.shipment_id.toString(),
      shipmentNumber: shipment.shipment_number,
      status: shipment.status,
      totalCartons: plans.length,
      packedCartons: plans.filter(p => p.status === 'PACKED').length,
      pendingCartons: plans.filter(p => p.status !== 'PACKED').length,
      cartons: plans.map(p => ({
        cartonIndex: p.carton_index,
        totalCartons: p.total_cartons,
        status: p.status,
        cartonTypeId: p.carton_type_id,
      })),
    };
  }

  // GAP-2.5: Cartonization rule CRUD
  @Post('cartonization-rules')
  @ApiOperation({ summary: 'Create cartonization rule' })
  async createCartonizationRule(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.prisma.cartonization_rules.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        rule_name: dto.ruleName,
        priority: dto.priority || 1,
        conditions_json: dto.conditionsJson || {},
        carton_type_id: dto.cartonTypeId ? BigInt(dto.cartonTypeId) : null,
        is_active: dto.isActive ?? true,
      },
    });
  }

  @Get('cartonization-rules')
  @ApiOperation({ summary: 'List cartonization rules' })
  async listCartonizationRules(@Req() req: any, @Query('facilityId') facilityId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.prisma.cartonization_rules.findMany({
      where: { tenant_id: tenantId, facility_id: BigInt(facilityId), is_active: true },
      orderBy: { priority: 'asc' },
    });
  }

  @Patch('cartonization-rules/:id')
  @ApiOperation({ summary: 'Update cartonization rule' })
  async updateCartonizationRule(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.prisma.cartonization_rules.updateMany({
      where: { tenant_id: tenantId, rule_id: BigInt(id) },
      data: {
        rule_name: dto.ruleName,
        priority: dto.priority,
        conditions_json: dto.conditionsJson,
        is_active: dto.isActive,
      },
    });
  }

  // APP-PACK-G: Picking quality report
  @Get('reports/picking-quality')
  @ApiOperation({ summary: 'Get picking quality report (APP-PACK-G)' })
  async pickingQualityReport(@Req() req: any, @Query('facilityId') facilityId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.getPickingQualityReport(tenantId, BigInt(facilityId));
  }
}
