import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceWebController, HazmatWebController } from './web/compliance.controller';

@Module({
  controllers: [ComplianceWebController, HazmatWebController],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
