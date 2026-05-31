import { Module } from '@nestjs/common';
import { NonConformanceReportsService } from './non-conformance-reports.service';
import { NonConformanceReportsWebController } from './web/non-conformance-reports.controller';

@Module({
  controllers: [NonConformanceReportsWebController],
  providers: [NonConformanceReportsService],
  exports: [NonConformanceReportsService],
})
export class NonConformanceReportsModule {}
