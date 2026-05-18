import { Module } from '@nestjs/common';
import { StorageLocationService } from './storage-location.service';
import { LocationCodeRefactorService } from './location-code-refactor.service';
import { StorageLocationController } from './storage-location.controller';
import { WarehouseFacilityController } from './warehouse-facility.controller';
import { WarehouseZoneController } from './warehouse-zone.controller';

@Module({
  controllers: [
    StorageLocationController,
    WarehouseFacilityController,
    WarehouseZoneController,
  ],
  providers: [StorageLocationService, LocationCodeRefactorService],
  exports: [StorageLocationService, LocationCodeRefactorService],
})
export class WarehouseModule {}
