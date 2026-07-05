import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';
import { PutawayService } from '../putaway.service';

@ApiTags('RF - Putaway')
@Controller('rf/inbound/putaway')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class RfPutawayController {
  constructor(private readonly putawayService: PutawayService) {}

  @Post('next-task')
  @ApiOperation({ summary: 'Get next unassigned putaway task for the facility (RF)' })
  @RfAction('update')
  async nextTask(@Req() req: any, @Body('facilityId') facilityId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.nextTask(tenantId, BigInt(facilityId));
  }

  @Post('scan-lpn')
  @ApiOperation({ summary: 'Lookup putaway task by scanning LPN barcode (RF)' })
  @RfAction('read')
  async scanLpn(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.findTaskByLpn(tenantId, BigInt(dto.facilityId), dto.lpnBarcode);
  }

  @Post('start')
  @ApiOperation({ summary: 'Start working on a putaway task (RF)' })
  @RfAction('update')
  async start(@Req() req: any, @Body('taskId') taskId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.startTask(tenantId, BigInt(taskId));
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assign putaway task to a user (RF)' })
  @RfAction('update')
  async assign(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.assignTask(tenantId, BigInt(dto.taskId), dto.userId);
  }

  @Post('scan-location')
  @ApiOperation({ summary: 'Scan location barcode to validate against directed putaway location (RF)' })
  @RfAction('read')
  async scanLocation(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    return this.putawayService.validateLocation(tenantId, facilityId, BigInt(dto.taskId), dto.locationBarcode);
  }

  @Post('suggest-location')
  @ApiOperation({ summary: 'Suggest putaway location for a task (RF)' })
  @RfAction('read')
  async suggestLocation(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.suggestLocation(
      tenantId, BigInt(dto.facilityId), BigInt(dto.productId),
      dto.categoryId ? BigInt(dto.categoryId) : undefined,
      dto.fromLocationId ? BigInt(dto.fromLocationId) : undefined,
      dto.hasExpiry,
    );
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm putaway placement (RF)' })
  @RfAction('update')
  async confirm(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.confirmPutaway(tenantId, dto);
  }

  @Post('my-tasks')
  @ApiOperation({ summary: 'Get my assigned putaway tasks (RF)' })
  @RfAction('read')
  async myTasks(@Req() req: any, @Body('userId') userId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.findAllTasks(tenantId, { assignedToUserId: userId, status: 'ASSIGNED' });
  }

  @Post('location-full')
  @ApiOperation({ summary: 'Flag location as full, get alternate (RF)' })
  @RfAction('update')
  async locationFull(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId || dto.userId;
    return this.putawayService.locationFullException(tenantId, BigInt(dto.taskId), userId);
  }

  @Post('report-damage')
  @ApiOperation({ summary: 'Report damage during putaway movement (RF)' })
  @RfAction('update')
  async reportDamage(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.putawayService.reportDamage(tenantId, BigInt(dto.taskId), { ...dto, userId: req.rfSession?.userId || dto.userId });
  }
}
