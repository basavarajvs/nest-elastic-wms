import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReportsController } from './web/reports.controller';
import { StockOnHandService } from './stock-on-hand.service';
import { MovementHistoryService } from './movement-history.service';
import { VelocityAbcService } from './velocity-abc.service';
import { AgingService } from './aging.service';
import { ExcelStreamerService } from './excel-streamer.service';
import { CsvStreamerService } from './csv-streamer.service';
import { S3UploadService } from './s3-upload.service';
import { ReportLockService } from './report-lock.service';
import { TimezoneService } from './timezone.service';
import { StockDailySnapshotService } from './stock-daily-snapshot.service';
import { QueueDepthMonitorService } from './queue-depth-monitor.service';
import { ReportProcessor } from './report.processor';
import { ReportSchedulerJob } from './report-scheduler.job';
import { ReportCacheInvalidatorService } from './report-cache-invalidator.service';
import { REPORT_QUEUE, REPORT_DLQ } from './report.types';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: REPORT_QUEUE,
        defaultJobOptions: {
          attempts: 2,
          backoff: { type: 'exponential', delay: 30000 },
          removeOnComplete: { count: 50 },
          removeOnFail: { count: 20 },
        },
      },
      {
        name: REPORT_DLQ,
      },
    ),
  ],
  controllers: [ReportsController],
  providers: [
    StockOnHandService,
    MovementHistoryService,
    VelocityAbcService,
    AgingService,
    ExcelStreamerService,
    CsvStreamerService,
    S3UploadService,
    ReportLockService,
    TimezoneService,
    StockDailySnapshotService,
    QueueDepthMonitorService,
    ReportProcessor,
    ReportSchedulerJob,
    ReportCacheInvalidatorService,
  ],
  exports: [StockDailySnapshotService],
})
export class ReportsModule {}
