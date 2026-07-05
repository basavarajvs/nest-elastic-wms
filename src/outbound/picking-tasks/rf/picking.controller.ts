import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';
import { PickingTaskService } from '../picking-task.service';

@ApiTags('RF - Picking')
@Controller('rf/outbound/pick')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class RfPickingController {
  constructor(private readonly pickingTaskService: PickingTaskService) {}

  @Post('next-task')
  @ApiOperation({ summary: 'Get next available pick task (RF)' })
  @RfAction('read')
  async nextTask(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.nextTask(tenantId, BigInt(dto.facilityId), dto.userId);
  }

  @Post('scan')
  @ApiOperation({ summary: 'Scan barcode to find pick task (RF)' })
  @RfAction('read')
  async scan(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.findTaskByBarcode(tenantId, BigInt(dto.facilityId), dto.barcode);
  }

  @Post('scan-location')
  @ApiOperation({ summary: 'Verify pick location by scanning location barcode (RF)' })
  @RfAction('read')
  async scanLocation(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.scanLocation(tenantId, BigInt(dto.taskId), dto.locationBarcode);
  }

  @Post('scan-product')
  @ApiOperation({ summary: 'Verify product by scanning product barcode (RF)' })
  @RfAction('read')
  async scanProduct(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.scanProduct(tenantId, BigInt(dto.taskId), dto.productCode);
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assign pick task to user (RF)' })
  @RfAction('update')
  async assign(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.assignTask(tenantId, BigInt(dto.taskId), dto.userId);
  }

  @Post('scan-tote')
  @ApiOperation({ summary: 'Scan destination tote/carton barcode (RF)' })
  @RfAction('read')
  async scanTote(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    return this.pickingTaskService.scanTote(tenantId, BigInt(dto.taskId), dto.toteBarcode, facilityId);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm pick — record picked qty, update inventory (RF)' })
  @RfAction('update')
  async confirm(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.confirmPick(tenantId, BigInt(dto.taskId), dto);
  }

  @Post('confirm-lpn')
  @ApiOperation({ summary: 'Confirm pick by scanning LPN barcode (RF)' })
  @RfAction('update')
  async confirmByLpn(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.confirmPickByLpn(tenantId, BigInt(dto.taskId), dto.lpnBarcode);
  }

  @Post('short-pick')
  @ApiOperation({ summary: 'Short pick — pick partial qty with reason (RF)' })
  @RfAction('update')
  async shortPick(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.shortPick(tenantId, BigInt(dto.taskId), dto);
  }

  @Post('my-tasks')
  @ApiOperation({ summary: 'Get my active pick tasks (RF)' })
  @RfAction('read')
  async myTasks(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.myTasks(tenantId, dto.userId, dto.facilityId ? BigInt(dto.facilityId) : undefined);
  }
}
