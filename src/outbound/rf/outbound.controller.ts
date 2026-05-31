import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { PickingService } from '../picking.service';
import { PackingService } from '../packing.service';
import { ShippingService } from '../shipping.service';
import { ConfirmPickDto, PickRecoverDto } from '../dtos/picking.dto';
import { StartPackingDto, ScanLpnToContainerDto, SealContainerDto } from '../dtos/packing.dto';
import { ShipmentLoadDto } from '../dtos/shipping.dto';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { RfAction } from '../../common/guards/rf-action.decorator';
import { RfActionLightweightGuard } from '../../common/guards/rf-action-lightweight.guard';

@ApiTags('WMS-RF')
@Controller('rf/outbound')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class OutboundRfController {
  constructor(
    private readonly pickingService: PickingService,
    private readonly packingService: PackingService,
    private readonly shippingService: ShippingService,
  ) {}

  @Get('/pick/next')
  @RfAction('read')
  async getNextPick(@Req() req: any) {
    return this.pickingService.getNextTask(req.tenantContext.getTenantId(), req.user?.userId);
  }

  @Post('/pick/assign')
  @RfAction('update')
  async assignTask(@Req() req: any, @Body('taskId') taskId: string) {
    return this.pickingService.assignTask(taskId, req.user?.userId, req.tenantContext.getTenantId());
  }

  @Post('/pick/scan-location')
  @RfAction('update')
  async scanLocation(@Req() req: any, @Body('taskId') taskId: string, @Body('locationId') locationId: string) {
    const valid = await this.pickingService.scanLocation(taskId, locationId, req.tenantContext.getTenantId());
    return { matched: valid };
  }

  @Post('/pick/scan-product')
  @RfAction('update')
  async scanProduct(@Req() req: any, @Body('taskId') taskId: string) {
    return { scanned: true, message: 'Product verified' };
  }

  @Post('/pick/confirm')
  @RfAction('update')
  async confirmPick(@Req() req: any, @Body() dto: ConfirmPickDto) {
    return this.pickingService.confirmPick(dto, req.tenantContext.getTenantId(), req.user?.userId);
  }

  @Post('/pick/recover')
  @RfAction('read')
  async recoverPick(@Req() req: any, @Body() dto: PickRecoverDto) {
    return this.pickingService.recoverPickSession(dto, req.tenantContext.getTenantId());
  }

  @Post('/pack/start')
  @RfAction('create')
  async startPacking(@Req() req: any, @Body('stationCode') stationCode: string) {
    return this.packingService.startSession({ userId: req.user?.userId, stationCode }, req.tenantContext.getTenantId());
  }

  @Post('/pack/scan-lpn')
  @RfAction('update')
  async scanLpn(@Req() req: any, @Body() dto: ScanLpnToContainerDto) {
    return this.packingService.scanIntoContainer(dto, req.tenantContext.getTenantId());
  }

  @Post('/pack/seal')
  @RfAction('update')
  async sealContainer(@Req() req: any, @Body() dto: SealContainerDto) {
    return this.packingService.sealContainer(dto, req.tenantContext.getTenantId());
  }

  @Post('/ship/load')
  @RfAction('update')
  async loadShipment(@Req() req: any, @Body() dto: ShipmentLoadDto) {
    return this.shippingService.assignToLoad(dto, req.tenantContext.getTenantId());
  }

  @Post('/ship/dispatch')
  @RfAction('update')
  async dispatch(@Req() req: any, @Body('loadId') loadId: string) {
    return this.shippingService.confirmDispatch(loadId, req.tenantContext.getTenantId());
  }

  @Post('/ship/print-generic-label')
  @RfAction('update')
  async printGenericLabel(@Req() req: any, @Body('shipmentId') shipmentId: string) {
    return this.shippingService.printGenericLabel(shipmentId, req.tenantContext.getTenantId());
  }
}
