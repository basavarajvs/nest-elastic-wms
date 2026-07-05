import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ShiftService } from './shifts/shift.service';
import { TimeTrackingService } from './time-tracking/time-tracking.service';
import { PerformanceService } from './performance/performance.service';
import { ShiftController } from './web/shift.controller';
import { TimeTrackingController } from './web/time-tracking.controller';
import { PerformanceController } from './web/performance.controller';
import { RfTimeTrackingController } from './rf/time-tracking.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    ShiftController,
    TimeTrackingController,
    PerformanceController,
    RfTimeTrackingController,
  ],
  providers: [
    ShiftService,
    TimeTrackingService,
    PerformanceService,
  ],
  exports: [
    ShiftService,
    TimeTrackingService,
    PerformanceService,
  ],
})
export class LaborModule {}
