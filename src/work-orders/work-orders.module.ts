import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkOrdersService } from './work-orders.service';
import { OperationsService } from './operations.service';
import { ComponentsService } from './components.service';
import { WorkOrderWebController } from './web/work-order.controller';
import { WorkOrderRfController } from './rf/work-order.controller';

@Module({
  imports: [PrismaModule],
  controllers: [WorkOrderWebController, WorkOrderRfController],
  providers: [WorkOrdersService, OperationsService, ComponentsService],
  exports: [WorkOrdersService, OperationsService, ComponentsService],
})
export class WorkOrdersModule {}
