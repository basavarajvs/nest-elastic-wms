import { Module } from '@nestjs/common';
import { VasExecutionService } from './vas-execution.service';
import { VasExecutionWebController } from './web/vas-execution.controller';
import { VasExecutionRfController } from './rf/vas-execution.controller';

@Module({
  controllers: [VasExecutionWebController, VasExecutionRfController],
  providers: [VasExecutionService],
  exports: [VasExecutionService],
})
export class VasExecutionModule {}
