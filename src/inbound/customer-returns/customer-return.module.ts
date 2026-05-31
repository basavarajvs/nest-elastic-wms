import { Module } from '@nestjs/common';
import { CustomerReturnService } from './customer-return.service';
import { CustomerReturnWebController } from './web/customer-return.controller';
import { CustomerReturnItemWebController } from './web/customer-return-item.controller';

@Module({
  controllers: [CustomerReturnWebController, CustomerReturnItemWebController],
  providers: [CustomerReturnService],
  exports: [CustomerReturnService],
})
export class CustomerReturnModule {}
