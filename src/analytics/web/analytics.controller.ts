import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { KpiService } from '../kpi.service';
import { HeatmapService } from '../heatmap.service';
import { QueryDailyKpiDto, QueryKpiSummaryDto } from '../dtos/query-kpi.dto';
import { QueryPickHeatmapDto, QueryTopLocationsDto } from '../dtos/query-heatmap.dto';

@ApiTags('WMS-WEB', 'Analytics')
@Controller('web/analytics')
@UseGuards(CaslGuard)
export class AnalyticsController {
  constructor(
    private readonly kpiService: KpiService,
    private readonly heatmapService: HeatmapService,
  ) {}

  @Get('kpi/daily')
  @CheckAbility({ action: 'read', subject: 'DailyKpiMetric' })
  @ApiOperation({ summary: 'Daily KPI metrics' })
  async getDailyKpi(@Req() req: any, @Query() query: QueryDailyKpiDto) {
    return this.kpiService.getDailyKpis(req.tenantContext.getTenantId(), query);
  }

  @Get('kpi/summary')
  @CheckAbility({ action: 'read', subject: 'DailyKpiMetric' })
  @ApiOperation({ summary: 'KPI aggregate summary' })
  async getKpiSummary(@Req() req: any, @Query() query: QueryKpiSummaryDto) {
    return this.kpiService.getSummary(req.tenantContext.getTenantId(), query);
  }

  @Get('heatmap/pick')
  @CheckAbility({ action: 'read', subject: 'LocationPickHeatmap' })
  @ApiOperation({ summary: 'Pick location heatmap data' })
  async getPickHeatmap(@Req() req: any, @Query() query: QueryPickHeatmapDto) {
    return this.heatmapService.getPickHeatmap(req.tenantContext.getTenantId(), query);
  }

  @Get('heatmap/locations/top')
  @CheckAbility({ action: 'read', subject: 'LocationPickHeatmap' })
  @ApiOperation({ summary: 'Top N pick locations' })
  async getTopLocations(@Req() req: any, @Query() query: QueryTopLocationsDto) {
    return this.heatmapService.getTopLocations(req.tenantContext.getTenantId(), query);
  }
}
