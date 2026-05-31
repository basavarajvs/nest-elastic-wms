import { Module } from '@nestjs/common';
import { CarrierService } from './carrier.service';
import { CarrierWebController } from './web/carrier.controller';

@Module({
  controllers: [CarrierWebController],
  providers: [CarrierService],
  exports: [CarrierService],
})
export class CarrierModule {}
