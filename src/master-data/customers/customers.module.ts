import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersWebController } from './web/customers.controller';

@Module({
  controllers: [CustomersWebController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
