import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FacilityService } from './facilities/facility.service';
import { FacilityAccessService } from './facilities/facility-access.service';
import { FacilityUserService } from './facilities/facility-user.service';
import { ZoneService } from './zones/zone.service';
import { LocationService } from './locations/location.service';
import { StructureService } from './structure/structure.service';
import { FacilityController } from './facilities/web/facility.controller';
import { FacilityAccessController } from './facilities/web/facility-access.controller';
import { FacilityUserController } from './facilities/web/facility-user.controller';
import { ZoneController } from './zones/web/zone.controller';
import { LocationController } from './locations/web/location.controller';
import { RfLocationController } from './locations/rf/location.controller';
import { StructureController } from './structure/web/structure.controller';
import { RfFacilityController } from './facilities/rf/facility.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    FacilityController,
    FacilityAccessController,
    FacilityUserController,
    ZoneController,
    LocationController,
    RfLocationController,
    RfFacilityController,
    StructureController,
  ],
  providers: [
    FacilityService,
    FacilityAccessService,
    FacilityUserService,
    ZoneService,
    LocationService,
    StructureService,
  ],
  exports: [
    FacilityService,
    FacilityAccessService,
    FacilityUserService,
    ZoneService,
    LocationService,
    StructureService,
  ],
})
export class WarehouseModule {}
