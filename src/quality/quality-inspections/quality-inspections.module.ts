import { Module } from '@nestjs/common';
import { QualityInspectionsService } from './quality-inspections.service';
import { QualityInspectionsWebController } from './web/quality-inspections.controller';
import { QualityInspectionsRfController } from './rf/quality-inspections.controller';

@Module({
  controllers: [QualityInspectionsWebController, QualityInspectionsRfController],
  providers: [QualityInspectionsService],
  exports: [QualityInspectionsService],
})
export class QualityInspectionsModule {}
