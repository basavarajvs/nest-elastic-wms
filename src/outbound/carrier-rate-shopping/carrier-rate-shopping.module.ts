import { Module } from '@nestjs/common';
import { CarrierRateShoppingService } from './carrier-rate-shopping.service';
import { CarrierRateShoppingWebController } from './web/carrier-rate-shopping.controller';

@Module({
  controllers: [CarrierRateShoppingWebController],
  providers: [CarrierRateShoppingService],
  exports: [CarrierRateShoppingService],
})
export class CarrierRateShoppingModule {}
