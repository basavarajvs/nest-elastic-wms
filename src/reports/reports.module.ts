import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportsService } from './reports.service';
import { ReportProcessor } from './report.processor';
import { ReportsWebController } from './web/reports.controller';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({ name: 'report-generation' }),
  ],
  controllers: [ReportsWebController],
  providers: [ReportsService, ReportProcessor],
  exports: [ReportsService],
})
export class ReportsModule {}
