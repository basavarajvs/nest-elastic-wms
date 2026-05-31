import { Module } from '@nestjs/common';
import { LoadingDocksService } from './loading-docks.service';
import { LoadingDocksWebController } from './web/loading-docks.controller';
import { LoadingDocksRfController } from './rf/loading-docks.controller';

@Module({
  controllers: [LoadingDocksWebController, LoadingDocksRfController],
  providers: [LoadingDocksService],
  exports: [LoadingDocksService],
})
export class LoadingDocksModule {}
