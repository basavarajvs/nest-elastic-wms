import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ProductService } from './product.service';
import { BarcodeService } from './barcode.service';
import { AttributeService } from './attribute.service';
import { ProductImportService } from './product-import.service';
import { ProductImportProcessor, PRODUCT_IMPORT_QUEUE } from './product-import.processor';
import { UomSeederService } from './uom-seeder.service';
import { ProductsWebController } from './web/products.controller';
import { ProductsRfController } from './rf/products.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: PRODUCT_IMPORT_QUEUE,
    }),
  ],
  controllers: [ProductsWebController, ProductsRfController],
  providers: [
    ProductService,
    BarcodeService,
    AttributeService,
    ProductImportService,
    ProductImportProcessor,
    UomSeederService,
  ],
  exports: [ProductService, BarcodeService, AttributeService, UomSeederService],
})
export class ProductsModule {}
