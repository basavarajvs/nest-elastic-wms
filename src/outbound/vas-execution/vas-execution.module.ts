import { Module, forwardRef } from '@nestjs/common';
import { VasExecutionService } from './vas-execution.service';
import { VasExecutionWebController } from './web/vas-execution.controller';
import { VasExecutionRfController } from './rf/vas-execution.controller';
import { VasCatalogModule } from '../vas-catalog/vas-catalog.module';

@Module({
  imports: [forwardRef(() => VasCatalogModule)],
  controllers: [VasExecutionWebController, VasExecutionRfController],
  providers: [VasExecutionService],
  exports: [VasExecutionService],
})
export class VasExecutionModule {}
