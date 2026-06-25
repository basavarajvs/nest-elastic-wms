import { Module } from '@nestjs/common';
import { ShiftService } from './shift.service';
import { TimeTrackingService } from './time-tracking.service';
import { PerformanceService } from './performance.service';
import { LaborWebController } from './web/labor.controller';
import { LaborRfController } from './rf/labor.controller';

@Module({
  controllers: [LaborWebController, LaborRfController],
  providers: [ShiftService, TimeTrackingService, PerformanceService],
  exports: [TimeTrackingService, PerformanceService],
})
export class LaborModule {}
