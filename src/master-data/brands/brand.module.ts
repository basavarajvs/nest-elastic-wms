import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandWebController } from './web/brand.controller';

@Module({
  controllers: [BrandWebController],
  providers: [BrandService],
  exports: [BrandService],
})
export class BrandModule {}
