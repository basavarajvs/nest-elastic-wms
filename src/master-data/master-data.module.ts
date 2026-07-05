import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientService } from './clients/client.service';
import { VendorService } from './vendors/vendor.service';
import { ProductService } from './products/product.service';
import { CarrierService } from './carriers/carrier.service';
import { CustomerService } from './customers/customer.service';
import { UomService } from './uom/uom.service';
import { BrandService } from './brands/brand.service';
import { CategoryService } from './categories/category.service';
import { ProductAttributeService } from './product-attributes/product-attribute.service';
import { ProductVariantService } from './product-variants/product-variant.service';
import { ProductSupplierService } from './product-suppliers/product-supplier.service';
import { ProductPackagingService } from './product-packaging/product-packaging.service';
import { ProductClientAssignmentService } from './product-client-assignments/product-client-assignment.service';
import { ProductVelocityService } from './product-velocity/product-velocity.service';
import { ProductImportService } from './product-import/product-import.service';
import { BarcodeLabelService } from './barcode-labels/barcode-label.service';
import { ClientController } from './clients/web/client.controller';
import { VendorController } from './vendors/web/vendor.controller';
import { ProductController } from './products/web/product.controller';
import { RfProductController } from './products/rf/product.controller';
import { CarrierController } from './carriers/web/carrier.controller';
import { CustomerController } from './customers/web/customer.controller';
import { UomController } from './uom/web/uom.controller';
import { BrandController } from './brands/web/brand.controller';
import { CategoryController } from './categories/web/category.controller';
import { ProductAttributeController } from './product-attributes/web/product-attribute.controller';
import { ProductVariantController } from './product-variants/web/product-variant.controller';
import { ProductSupplierController } from './product-suppliers/web/product-supplier.controller';
import { ProductPackagingController } from './product-packaging/web/product-packaging.controller';
import { ProductClientAssignmentController } from './product-client-assignments/web/product-client-assignment.controller';
import { ProductVelocityController } from './product-velocity/web/product-velocity.controller';
import { ProductImportController } from './product-import/web/product-import.controller';
import { BarcodeLabelController } from './barcode-labels/web/barcode-label.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    ClientController,
    VendorController,
    ProductController,
    RfProductController,
    CarrierController,
    CustomerController,
    UomController,
    BrandController,
    CategoryController,
    ProductAttributeController,
    ProductVariantController,
    ProductSupplierController,
    ProductPackagingController,
    ProductClientAssignmentController,
    ProductVelocityController,
    ProductImportController,
    BarcodeLabelController,
  ],
  providers: [
    ClientService,
    VendorService,
    ProductService,
    CarrierService,
    CustomerService,
    UomService,
    BrandService,
    CategoryService,
    ProductAttributeService,
    ProductVariantService,
    ProductSupplierService,
    ProductPackagingService,
    ProductClientAssignmentService,
    ProductVelocityService,
    ProductImportService,
    BarcodeLabelService,
  ],
  exports: [
    ClientService,
    VendorService,
    ProductService,
  ],
})
export class MasterDataModule {}
