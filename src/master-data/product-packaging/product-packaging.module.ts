import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProductPackagingService } from './product-packaging.service';
import { ProductPackagingWebController } from './web/product-packaging.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ProductPackagingWebController],
  providers: [ProductPackagingService],
  exports: [ProductPackagingService],
})
export class ProductPackagingModule {}
