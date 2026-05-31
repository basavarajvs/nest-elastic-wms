import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProductSuppliersService } from './product-suppliers.service';
import { ProductSuppliersWebController } from './web/product-suppliers.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ProductSuppliersWebController],
  providers: [ProductSuppliersService],
  exports: [ProductSuppliersService],
})
export class ProductSuppliersModule {}
