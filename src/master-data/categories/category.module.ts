import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryWebController } from './web/category.controller';

@Module({
  controllers: [CategoryWebController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
