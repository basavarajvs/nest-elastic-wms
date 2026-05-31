import { Module } from '@nestjs/common';
import { LoadService } from './load.service';
import { LoadWebController } from './web/load.controller';

@Module({
  controllers: [LoadWebController],
  providers: [LoadService],
  exports: [LoadService],
})
export class LoadModule {}
