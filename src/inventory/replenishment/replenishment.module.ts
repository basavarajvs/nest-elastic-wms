import { Module } from '@nestjs/common';
import { ReplenishmentService } from './replenishment.service';
import { ReplenishmentWebController } from './web/replenishment.controller';

@Module({
  controllers: [ReplenishmentWebController],
  providers: [ReplenishmentService],
  exports: [ReplenishmentService],
})
export class ReplenishmentModule {}
