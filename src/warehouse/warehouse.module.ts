import { Module } from '@nestjs/common';
import { StorageLocationService } from './storage-location.service';
import { LocationCodeRefactorService } from './location-code-refactor.service';
import { SystemSettingService } from './system-setting.service';
import { StorageLocationController } from './storage-location.controller';
import { SystemSettingController } from './system-setting.controller';
import { WarehouseFacilityController } from './warehouse-facility.controller';
import { WarehouseZoneController } from './warehouse-zone.controller';

@Module({
  controllers: [
    StorageLocationController,
    WarehouseFacilityController,
    WarehouseZoneController,
    SystemSettingController,
  ],
  providers: [StorageLocationService, LocationCodeRefactorService, SystemSettingService],
  exports: [StorageLocationService, LocationCodeRefactorService, SystemSettingService],
})
export class WarehouseModule {}
