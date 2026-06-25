import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { KpiService } from './kpi.service';
import { HeatmapService } from './heatmap.service';
import { AnalyticsController } from './web/analytics.controller';

@Module({
  imports: [PrismaModule],
  providers: [KpiService, HeatmapService],
  controllers: [AnalyticsController],
  exports: [KpiService, HeatmapService],
})
export class AnalyticsModule {}
