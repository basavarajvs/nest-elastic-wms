import { Module } from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { OperationsService } from './operations.service';
import { ComponentsService } from './components.service';
import { WorkOrdersWebController } from './web/work-orders.controller';
import { WorkOrdersRfController } from './rf/work-orders.controller';

@Module({
  controllers: [WorkOrdersWebController, WorkOrdersRfController],
  providers: [WorkOrdersService, OperationsService, ComponentsService],
  exports: [WorkOrdersService, OperationsService, ComponentsService],
})
export class WorkOrdersModule {}
