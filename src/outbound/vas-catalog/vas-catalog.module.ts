import { Module } from '@nestjs/common';
import { VasCatalogService } from './vas-catalog.service';
import { VasCatalogWebController } from './web/vas-catalog.controller';
import { VasCatalogRfController } from './rf/vas-catalog.controller';

@Module({
  controllers: [VasCatalogWebController, VasCatalogRfController],
  providers: [VasCatalogService],
  exports: [VasCatalogService],
})
export class VasCatalogModule {}
