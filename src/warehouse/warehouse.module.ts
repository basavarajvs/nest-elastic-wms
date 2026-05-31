import { Module } from '@nestjs/common';
import { StorageLocationService } from './storage-location.service';
import { LocationCodeRefactorService } from './location-code-refactor.service';
import { SystemSettingService } from './system-setting.service';
import { WarehouseFacilityService } from './warehouse-facility.service';
import { WarehouseZoneService } from './warehouse-zone.service';
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
  providers: [
    StorageLocationService,
    LocationCodeRefactorService,
    SystemSettingService,
    WarehouseFacilityService,
    WarehouseZoneService,
  ],
  exports: [
    StorageLocationService,
    LocationCodeRefactorService,
    SystemSettingService,
    WarehouseFacilityService,
    WarehouseZoneService,
  ],
})
export class WarehouseModule {}
