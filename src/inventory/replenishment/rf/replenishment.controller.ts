import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { ReplenishmentService } from '../../../outbound/replenishment/replenishment.service';

@ApiTags('WMS-RF')
@Controller('rf/replenishment')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class ReplenishmentRfController {
  constructor(private readonly service: ReplenishmentService) {}

  @Post('next')
  @RfAction('read')
  async next(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.getNextTask(tenantId, dto.facilityId);
  }

  @Post('scan-location')
  @RfAction('read')
  async scanLocation(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.scanLocation(tenantId, dto.taskId, dto.locationCode);
  }

  @Post('scan-product')
  @RfAction('read')
  async scanProduct(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.scanProduct(tenantId, dto.taskId, dto.productCode);
  }

  @Post('confirm')
  @RfAction('update')
  async confirm(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession.userId;
    return this.service.confirmTask(tenantId, dto.taskId, userId);
  }
}
