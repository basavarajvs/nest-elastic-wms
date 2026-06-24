import { Module } from '@nestjs/common';
import { PackingStationsService } from './packing-stations.service';
import { PackingService } from './packing.service';
import { PackingStationsWebController } from './web/packing-stations.controller';
import { PackingWebController } from './web/packing.controller';
import { PackingStationsRfController } from './rf/packing-stations.controller';
import { PackingRfController } from './rf/packing.controller';

@Module({
  controllers: [PackingStationsWebController, PackingWebController, PackingStationsRfController, PackingRfController],
  providers: [PackingStationsService, PackingService],
  exports: [PackingStationsService, PackingService],
})
export class PackingStationsModule {}
