import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { TimeTrackingService } from '../time-tracking.service';
import { PerformanceService } from '../performance.service';
import { ClockInDto, ClockOutDto } from '../dtos/labor.dto';

@ApiTags('WMS-RF', 'Labor')
@Controller('rf/labor')
@UseGuards(RfSessionGuard)
export class LaborRfController {
  constructor(
    private readonly timeTrackingService: TimeTrackingService,
    private readonly performanceService: PerformanceService,
  ) {}

  @Post('clock-in')
  @ApiOperation({ summary: 'Clock in via RF' })
  async clockIn(@Body() dto: ClockInDto, @Req() req: any) {
    return this.timeTrackingService.clockIn(dto, req.rfSession?.userId || req.tenantContext.getUserId(), req.tenantContext.getTenantId());
  }

  @Post('clock-out')
  @ApiOperation({ summary: 'Clock out via RF' })
  async clockOut(@Body() dto: ClockOutDto, @Req() req: any) {
    return this.timeTrackingService.clockOut(dto, req.rfSession?.userId || req.tenantContext.getUserId(), req.tenantContext.getTenantId());
  }

  @Get('my-metrics')
  @ApiOperation({ summary: 'Get my today\'s metrics' })
  async myMetrics(@Req() req: any) {
    return this.performanceService.getMyMetrics(req.rfSession?.userId || req.tenantContext.getUserId(), req.tenantContext.getTenantId());
  }
}
