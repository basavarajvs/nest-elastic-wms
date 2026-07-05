import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EquipmentService } from './equipment.service';
import { MaintenanceService } from './maintenance/maintenance.service';
import { EquipmentController } from './web/equipment.controller';
import { MaintenanceController } from './web/maintenance.controller';
import { RfEquipmentController } from './rf/equipment.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    EquipmentController,
    MaintenanceController,
    RfEquipmentController,
  ],
  providers: [
    EquipmentService,
    MaintenanceService,
  ],
  exports: [
    EquipmentService,
    MaintenanceService,
  ],
})
export class EquipmentModule {}
