import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CycleCountService } from './cycle-count.service';
import { CountMetricsService } from './count-metrics.service';
import { CountWebController } from './web/counts.controller';
import { CountMetricsWebController } from './web/count-metrics.controller';
import { CountLineWebController } from './web/count-lines.controller';
import { CountRfController } from './rf/counts.controller';
import { CountSchedulerProcessor } from './count-scheduler.processor';
import { OfflineCountBuffer } from './offline-count-buffer.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'count-scheduler' })],
  controllers: [CountWebController, CountMetricsWebController, CountLineWebController, CountRfController],
  providers: [CycleCountService, CountMetricsService, CountSchedulerProcessor, OfflineCountBuffer],
  exports: [CycleCountService, CountMetricsService],
})
export class CycleCountModule {}
