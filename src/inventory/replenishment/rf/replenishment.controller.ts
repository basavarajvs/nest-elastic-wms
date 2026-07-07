import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse } from '@nestjs/swagger';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { ReplenishmentService } from '../../../outbound/replenishment/replenishment.service';
import { ReplenishmentNextTaskResponseDto, RfReplenishmentNextDto, RfReplenishmentScanLocationDto, RfReplenishmentScanProductDto, RfReplenishmentConfirmDto, RfReplenishmentScanLocationResponseDto, RfReplenishmentScanProductResponseDto, RfReplenishmentConfirmResponseDto } from '../../../inventory/dtos/inventory-response.dto';

@ApiTags('WMS-RF')
@Controller('rf/replenishment')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class ReplenishmentRfController {
  constructor(private readonly service: ReplenishmentService) {}

  @Post('next')
  @RfAction('read')
  @ApiCreatedResponse({ type: ReplenishmentNextTaskResponseDto })
  async next(@Req() req: any, @Body() dto: RfReplenishmentNextDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.getNextTask(tenantId, dto.facility_id);
  }

  @Post('scan-location')
  @RfAction('read')
  @ApiCreatedResponse({ type: RfReplenishmentScanLocationResponseDto })
  async scanLocation(@Req() req: any, @Body() dto: RfReplenishmentScanLocationDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.scanLocation(tenantId, dto.task_id, dto.location_code);
  }

  @Post('scan-product')
  @RfAction('read')
  @ApiCreatedResponse({ type: RfReplenishmentScanProductResponseDto })
  async scanProduct(@Req() req: any, @Body() dto: RfReplenishmentScanProductDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.scanProduct(tenantId, dto.task_id, dto.product_code);
  }

  @Post('confirm')
  @RfAction('update')
  @ApiCreatedResponse({ type: RfReplenishmentConfirmResponseDto })
  async confirm(@Req() req: any, @Body() dto: RfReplenishmentConfirmDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession.userId;
    return this.service.confirmTask(tenantId, dto.task_id, userId);
  }
}
