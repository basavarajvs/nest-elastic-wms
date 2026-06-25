import { Module } from '@nestjs/common';
import { DockYardService } from './dock-yard.service';
import { DockAppointmentWebController, YardVehicleWebController } from './web/dock-yard.controller';
import { DockYardRfController } from './rf/dock-yard.controller';

@Module({
  controllers: [DockAppointmentWebController, YardVehicleWebController, DockYardRfController],
  providers: [DockYardService],
  exports: [DockYardService],
})
export class DockYardModule {}
