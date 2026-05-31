import { Module } from '@nestjs/common';
import { ProductClientAssignmentsService } from './product-client-assignments.service';
import { ProductClientAssignmentsWebController } from './web/product-client-assignments.controller';

@Module({
  controllers: [ProductClientAssignmentsWebController],
  providers: [ProductClientAssignmentsService],
  exports: [ProductClientAssignmentsService],
})
export class ProductClientAssignmentsModule {}
