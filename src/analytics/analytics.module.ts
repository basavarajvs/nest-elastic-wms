import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { KpiService } from '../observability/kpi/kpi.service';
import { HeatmapService } from '../observability/heatmap/heatmap.service';
import { KpiWebController } from './kpi/web/kpi.controller';
import { HeatmapWebController } from './heatmap/web/heatmap.controller';

@Module({
  imports: [PrismaModule],
  controllers: [KpiWebController, HeatmapWebController],
  providers: [KpiService, HeatmapService],
  exports: [KpiService, HeatmapService],
})
export class AnalyticsModule {}
