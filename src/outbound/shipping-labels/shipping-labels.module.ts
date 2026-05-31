import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ShippingLabelsService } from './shipping-labels.service';
import { ShippingLabelsWebController } from './web/shipping-labels.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ShippingLabelsWebController],
  providers: [ShippingLabelsService],
  exports: [ShippingLabelsService],
})
export class ShippingLabelsModule {}
