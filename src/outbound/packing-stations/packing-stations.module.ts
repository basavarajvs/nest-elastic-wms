import { Module } from '@nestjs/common';
import { PackingStationsService } from './packing-stations.service';
import { PackingStationsWebController } from './web/packing-stations.controller';
import { PackingStationsRfController } from './rf/packing-stations.controller';

@Module({
  controllers: [PackingStationsWebController, PackingStationsRfController],
  providers: [PackingStationsService],
  exports: [PackingStationsService],
})
export class PackingStationsModule {}
