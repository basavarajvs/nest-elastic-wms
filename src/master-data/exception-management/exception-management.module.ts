import { Module } from '@nestjs/common';
import { ExceptionManagementService } from './exception-management.service';
import { ExceptionManagementWebController } from './web/exception-management.controller';
import { ExceptionManagementRfController } from './rf/exception-management.controller';

@Module({
  controllers: [ExceptionManagementWebController, ExceptionManagementRfController],
  providers: [ExceptionManagementService],
  exports: [ExceptionManagementService],
})
export class ExceptionManagementModule {}
