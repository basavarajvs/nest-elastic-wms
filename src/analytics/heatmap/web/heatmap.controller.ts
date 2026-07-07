import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { WmsAction } from '../../../casl/casl.types';
import { HeatmapService } from '../../../observability/heatmap/heatmap.service';
import { PickHeatmapResponseDto, TopLocationRowDto } from '../../dto/heatmap-response.dto';

@ApiTags('Analytics - Heatmap')
@UseGuards(JwtAuthGuard, CaslGuard)
@Controller('web/analytics/heatmap')
export class HeatmapWebController {
  constructor(private readonly heatmapService: HeatmapService) {}

  @Get('pick')
  @CheckAbility({ action: WmsAction.List, subject: 'LocationPickHeatmap' })
  @ApiOperation({ summary: 'Pick location heatmap' })
  @ApiOkResponse({ type: PickHeatmapResponseDto })
  async getPickHeatmap(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.heatmapService.getPickHeatmap(tenantId, query);
  }

  @Get('locations/top')
  @CheckAbility({ action: WmsAction.Read, subject: 'LocationPickHeatmap' })
  @ApiOperation({ summary: 'Top pick locations' })
  @ApiOkResponse({ type: [TopLocationRowDto] })
  async getTopLocations(@Req() req: any, @Query('limit') limit: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.heatmapService.getTopLocations(tenantId, Number(limit) || 20);
  }
}
