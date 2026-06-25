import { Module } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { MaintenanceService } from './maintenance.service';
import { EquipmentWebController } from './web/equipment.controller';
import { EquipmentRfController } from './rf/equipment.controller';

@Module({
  controllers: [EquipmentWebController, EquipmentRfController],
  providers: [EquipmentService, MaintenanceService],
  exports: [EquipmentService, MaintenanceService],
})
export class EquipmentModule {}
