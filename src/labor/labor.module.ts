import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ShiftService } from './shifts/shift.service';
import { ShiftAssignmentService } from './shift-assignment.service';
import { TimeTrackingService } from './time-tracking/time-tracking.service';
import { PerformanceService } from './performance/performance.service';
import { ShiftController } from './web/shift.controller';
import { ShiftAssignmentController } from './web/shift-assignment.controller';
import { TimeTrackingController } from './web/time-tracking.controller';
import { PerformanceController } from './web/performance.controller';
import { RfTimeTrackingController } from './rf/time-tracking.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    ShiftController,
    ShiftAssignmentController,
    TimeTrackingController,
    PerformanceController,
    RfTimeTrackingController,
  ],
  providers: [
    ShiftService,
    ShiftAssignmentService,
    TimeTrackingService,
    PerformanceService,
  ],
  exports: [
    ShiftService,
    ShiftAssignmentService,
    TimeTrackingService,
    PerformanceService,
  ],
})
export class LaborModule {}
