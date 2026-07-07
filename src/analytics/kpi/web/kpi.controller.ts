import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { WmsAction } from '../../../casl/casl.types';
import { KpiService } from '../../../observability/kpi/kpi.service';
import { DailyKpiResponseDto, KpiMetricSummaryDto } from '../../dto/kpi-response.dto';

@ApiTags('Analytics - KPI')
@UseGuards(JwtAuthGuard, CaslGuard)
@Controller('web/analytics/kpi')
export class KpiWebController {
  constructor(private readonly kpiService: KpiService) {}

  @Get('daily')
  @CheckAbility({ action: WmsAction.List, subject: 'DailyKpiMetric' })
  @ApiOperation({ summary: 'Daily KPI metrics' })
  @ApiOkResponse({ type: DailyKpiResponseDto })
  async getDaily(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.kpiService.getDaily(tenantId, query);
  }

  @Get('summary')
  @CheckAbility({ action: WmsAction.Read, subject: 'DailyKpiMetric' })
  @ApiOperation({ summary: 'KPI summary (aggregated)' })
  @ApiOkResponse({ type: [KpiMetricSummaryDto] })
  async getSummary(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.kpiService.getSummary(tenantId, query);
  }
}
