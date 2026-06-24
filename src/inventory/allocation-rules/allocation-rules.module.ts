import { Module } from '@nestjs/common';
import { AllocationRulesService } from './allocation-rules.service';
import { AllocationRulesWebController } from './web/allocation-rules.controller';

@Module({
  controllers: [AllocationRulesWebController],
  providers: [AllocationRulesService],
  exports: [AllocationRulesService],
})
export class AllocationRulesModule {}
