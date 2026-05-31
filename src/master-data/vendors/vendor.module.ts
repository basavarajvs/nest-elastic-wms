import { Module } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { VendorWebController } from './web/vendor.controller';
import { VendorContactWebController } from './web/vendor-contact.controller';
import { VendorAddressWebController } from './web/vendor-address.controller';

@Module({
  controllers: [VendorWebController, VendorContactWebController, VendorAddressWebController],
  providers: [VendorService],
  exports: [VendorService],
})
export class VendorModule {}
