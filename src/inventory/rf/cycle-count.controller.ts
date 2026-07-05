import { Controller, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../common/decorators/rf-action.decorator';
import { CycleCountService } from '../counts/cycle-count.service';
import { RootCauseService } from '../counts/root-cause.service';

@ApiTags('WMS-RF')
@Controller('rf/cycle-counts')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class CycleCountRfController {
  constructor(
    private readonly service: CycleCountService,
    private readonly rootCauseService: RootCauseService,
  ) {}

  @Post('start')
  @RfAction('create')
  async start(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, { ...dto, status: 'IN_PROGRESS', userId: req.rfSession.userId });
  }

  @Post('scan-location')
  @RfAction('read')
  async scanLocation(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    return this.service.scanLocationForCount(tenantId, facilityId, dto.locationBarcode || dto.locationCode);
  }

  @Post('scan-lpn')
  @RfAction('read')
  async scanLpn(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    return this.service.verifyItemAtLocation(tenantId, facilityId, dto.locationBarcode, dto.lpnBarcode);
  }

  @Post('enter-qty')
  @RfAction('update')
  async enterQty(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.submitLine(tenantId, dto.countId, dto);
  }

  @Post('submit-line')
  @RfAction('update')
  async submitLine(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.submitLine(tenantId, dto.countId, dto);
  }

  @Post('complete')
  @RfAction('update')
  async complete(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession.userId;
    return this.service.complete(tenantId, dto.countId, userId);
  }

  @Post('pending-reviews')
  @RfAction('read')
  async pendingReviews(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    return this.service.getPendingReviews(tenantId, facilityId);
  }

  @Post(':id/approve')
  @RfAction('update')
  async approve(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId || 'system';
    return this.service.approveVariance(tenantId, BigInt(id), userId);
  }

  @Post(':id/reject')
  @RfAction('update')
  async reject(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId || 'system';
    return this.service.rejectVariance(tenantId, BigInt(id), userId, dto.reason);
  }

  @Post(':id/recount')
  @RfAction('update')
  async recount(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId || 'system';
    return this.service.requestRecount(tenantId, BigInt(id), userId);
  }

  @Post(':id/root-cause')
  @RfAction('update')
  async rootCause(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.rootCauseService.assignRootCause(tenantId, BigInt(id), BigInt(dto.categoryId), dto.description);
  }
}
