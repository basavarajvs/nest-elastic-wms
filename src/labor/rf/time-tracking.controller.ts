import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../common/decorators/rf-action.decorator';
import { TimeTrackingService } from '../time-tracking/time-tracking.service';
import { PerformanceService } from '../performance/performance.service';

@ApiTags('WMS-RF Labor')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
@Controller('rf/labor')
export class RfTimeTrackingController {
  constructor(
    private readonly timeTrackingService: TimeTrackingService,
    private readonly performanceService: PerformanceService,
  ) {}

  @Post('clock-in')
  @RfAction('create')
  @ApiOperation({ summary: 'RF: Clock in' })
  async clockIn(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId;
    return this.timeTrackingService.clockIn(tenantId, userId, dto);
  }

  @Post('clock-out')
  @RfAction('update')
  @ApiOperation({ summary: 'RF: Clock out' })
  async clockOut(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId;
    return this.timeTrackingService.clockOut(tenantId, userId, dto);
  }

  @Post('my-metrics')
  @RfAction('read')
  @ApiOperation({ summary: 'RF: Get my performance metrics' })
  async myMetrics(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId;
    return this.performanceService.findAll(tenantId, { userId, ...dto });
  }
}
