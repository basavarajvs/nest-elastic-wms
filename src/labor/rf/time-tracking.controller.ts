import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { TimeLogResponseDto, ClockInDto, ClockOutDto, MyMetricsDto } from '../dtos/time-log-response.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
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
  @ApiCreatedResponse({ type: TimeLogResponseDto })
  async clockIn(@Req() req: any, @Body() dto: ClockInDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId;
    return this.timeTrackingService.clockIn(tenantId, userId, dto);
  }

  @Post('clock-out')
  @RfAction('update')
  @ApiOperation({ summary: 'RF: Clock out' })
  @ApiCreatedResponse({ type: TimeLogResponseDto })
  async clockOut(@Req() req: any, @Body() dto: ClockOutDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId;
    return this.timeTrackingService.clockOut(tenantId, userId, dto);
  }

  @Post('my-metrics')
  @RfAction('read')
  @ApiOperation({ summary: 'RF: Get my performance metrics' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async myMetrics(@Req() req: any, @Body() dto: MyMetricsDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId;
    return this.performanceService.findAll(tenantId, { userId, ...dto });
  }
}
