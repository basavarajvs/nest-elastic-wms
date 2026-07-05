import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { LoadService } from '../../loads/load.service';
import { ShipmentService } from '../shipment.service';
import { PrismaService } from '../../../prisma/prisma.service';

@ApiTags('RF - Shipping')
@Controller('rf/outbound/shipping')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class RfShippingController {
  constructor(
    private readonly loadService: LoadService,
    private readonly shipmentService: ShipmentService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('start-load')
  @RfAction('create')
  @ApiOperation({ summary: 'Start loading session — scan dock door, find or create load (RF)' })
  async startLoad(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    const userId = req.rfSession.userId;
    let dockCode = dto.dockDoorCode;
    if (dockCode) {
      const dock = await this.prisma.loading_docks.findFirst({
        where: { tenant_id: tenantId, facility_id: facilityId, dock_code: dockCode, is_active: true },
      });
      if (!dock) throw new Error(`Dock door ${dockCode} not found`);
    }
    let load = dto.loadNumber
      ? await this.prisma.loads.findFirst({ where: { tenant_id: tenantId, facility_id: facilityId, load_number: dto.loadNumber } })
      : null;
    if (!load) {
      load = await this.prisma.loads.create({
        data: {
          tenant_id: tenantId, facility_id: facilityId,
          load_number: dto.loadNumber || `LOAD-${Date.now()}`,
          load_name: dto.loadName || null, dock_door_number: dockCode || null,
          trailer_number: dto.trailerNumber || null, status: 'LOADING',
          load_start_time: new Date(), loaded_by: userId,
        },
      });
      if (dockCode) {
        await this.prisma.loading_docks.updateMany({
          where: { tenant_id: tenantId, facility_id: facilityId, dock_code: dockCode },
          data: { is_available: false },
        });
      }
    }
    return { loadId: load.load_id.toString(), loadNumber: load.load_number, dockDoor: dockCode || null };
  }

  @Post('scan-lpn')
  @RfAction('update')
  @ApiOperation({ summary: 'Scan shipping LPN to load onto trailer (RF)' })
  async scanLpn(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    const loadId = BigInt(dto.loadId);
    const lpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, lpn_number: dto.lpnBarcode },
    });
    if (!lpn) throw new Error('LPN not found');
    if (lpn.status !== 'PACKED') throw new Error('LPN must be in PACKED status for loading');
    if (dto.verifyRoute && lpn.assigned_shipment_id) {
      const existingLoadId = (await this.prisma.outbound_shipments.findFirst({
        where: { tenant_id: tenantId, shipment_id: lpn.assigned_shipment_id },
      }))?.load_id;
      if (existingLoadId && existingLoadId !== loadId) {
        throw new Error(`WRONG TRUCK: LPN ${dto.lpnBarcode} belongs to a different trailer`);
      }
    }
    await this.prisma.license_plate_numbers.updateMany({
      where: { tenant_id: tenantId, lpn_id: lpn.lpn_id },
      data: { assigned_load_id: loadId, status: 'LOADED', loaded_at: new Date() },
    });
    await this.prisma.loads.updateMany({
      where: { tenant_id: tenantId, load_id: loadId },
      data: { loaded_cartons: { increment: 1 } },
    });
    const load = await this.prisma.loads.findFirst({ where: { tenant_id: tenantId, load_id: loadId } });
    return {
      lpnId: lpn.lpn_id.toString(), lpnNumber: lpn.lpn_number,
      loadId: loadId.toString(),
      loadProgress: `${load?.loaded_cartons || 0}/${load?.total_cartons || '?'}`,
    };
  }

  @Post('close-trailer')
  @RfAction('update')
  @ApiOperation({ summary: 'Close and seal trailer after loading complete (RF)' })
  async closeTrailer(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const loadId = BigInt(dto.loadId);
    const userId = req.rfSession.userId;
    const load = await this.prisma.loads.findFirst({ where: { tenant_id: tenantId, load_id: loadId } });
    if (!load) throw new Error('Load not found');
    if (load.status === 'CLOSED' || load.status === 'DEPARTED' || load.status === 'DELIVERED') {
      throw new Error('Load is already closed or departed');
    }
    await this.prisma.loads.updateMany({
      where: { tenant_id: tenantId, load_id: loadId },
      data: { status: 'LOADED', seal_number: dto.sealNumber || load.seal_number, load_completed_time: new Date(), updated_by: userId },
    });
    await this.prisma.license_plate_numbers.updateMany({
      where: { tenant_id: tenantId, assigned_load_id: loadId },
      data: { status: 'LOADED' },
    });
    const shipments = await this.prisma.outbound_shipments.findMany({
      where: { tenant_id: tenantId, load_id: loadId },
      select: { order_id: true },
    });
    for (const shipment of shipments) {
      if (shipment.order_id) {
        await this.prisma.sales_orders.updateMany({
          where: { tenant_id: tenantId, order_id: shipment.order_id },
          data: { status: 'SHIPPED' },
        });
      }
    }
    if (load.dock_door_number) {
      await this.prisma.loading_docks.updateMany({
        where: { tenant_id: tenantId, facility_id: load.facility_id, dock_code: load.dock_door_number },
        data: { is_available: true },
      });
    }
    return { loadId: loadId.toString(), loadNumber: load.load_number, sealNumber: dto.sealNumber || load.seal_number, status: 'LOADED' };
  }

  @Post('get-next')
  @RfAction('read')
  @ApiOperation({ summary: 'Get next loading work (directed assignment)' })
  async getNext(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    return this.loadService.getNextLoadingWork(tenantId, facilityId, req.rfSession?.userId || dto.userId);
  }

  @Post('verify-shipment')
  @RfAction('read')
  @ApiOperation({ summary: 'Verify all cartons for a shipment are loaded' })
  async verifyShipment(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.shipmentService.verifyShipmentCompleteness(tenantId, BigInt(dto.shipmentId));
  }

  @Post('verify-load')
  @RfAction('read')
  @ApiOperation({ summary: 'Verify all shipments on a load are complete' })
  async verifyLoad(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.shipmentService.verifyLoad(tenantId, BigInt(dto.loadId));
  }

  @Post('close-shipment')
  @RfAction('update')
  @ApiOperation({ summary: 'Close individual shipment' })
  async closeShipment(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.shipmentService.closeShipment(tenantId, BigInt(dto.shipmentId), dto.force);
  }

  @Post('capacity')
  @RfAction('read')
  @ApiOperation({ summary: 'Check trailer capacity before loading' })
  async capacity(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.loadService.validateCapacity(tenantId, BigInt(dto.loadId), Number(dto.cartonWeightKg || 0));
  }

  @Post('handoff')
  @RfAction('update')
  @ApiOperation({ summary: 'Transfer custody to carrier' })
  async handoff(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.loadService.transferToCarrier(tenantId, BigInt(dto.loadId), dto.driverName);
  }
}
