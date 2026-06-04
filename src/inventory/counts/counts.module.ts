import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CycleCountService } from './cycle-count.service';
import { CountWebController } from './web/counts.controller';
import { CountLineWebController } from './web/count-lines.controller';
import { CountRfController } from './rf/counts.controller';
import { CountSchedulerProcessor } from './count-scheduler.processor';
import { OfflineCountBuffer } from './offline-count-buffer.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'count-scheduler' })],
  controllers: [CountWebController, CountLineWebController, CountRfController],
  providers: [CycleCountService, CountSchedulerProcessor, OfflineCountBuffer],
  exports: [CycleCountService],
})
export class CycleCountModule {}
