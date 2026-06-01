import { Module } from '@nestjs/common';
import { AisleService } from './services/aisle.service';
import { BayService } from './services/bay.service';
import { RackService } from './services/rack.service';
import { LevelService } from './services/level.service';
import { AisleController } from './web/aisle.controller';
import { BayController } from './web/bay.controller';
import { RackController } from './web/rack.controller';
import { LevelController } from './web/level.controller';

@Module({
  controllers: [AisleController, BayController, RackController, LevelController],
  providers: [AisleService, BayService, RackService, LevelService],
  exports: [AisleService, BayService, RackService, LevelService],
})
export class HierarchyModule {}
