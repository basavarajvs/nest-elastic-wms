import { Processor, WorkerHost, OnWorkerEvent, InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../common/cache/redis.constants';
import { ExcelStreamerService } from './excel-streamer.service';
import { CsvStreamerService } from './csv-streamer.service';
import { S3UploadService } from './s3-upload.service';
import { ReportLockService } from './report-lock.service';
import { TimezoneService } from './timezone.service';
import { WmsNotificationClientService } from '../notifications/wms-notification-client.service';
import { StockOnHandService } from './stock-on-hand.service';
import { MovementHistoryService } from './movement-history.service';
import { VelocityAbcService } from './velocity-abc.service';
import { AgingService } from './aging.service';
import { ReportType, ReportStatus, REPORT_METRICS_PREFIX } from './report.types';

const HEADERS: Record<string, string[]> = {
  STOCK_ON_HAND: [
    'product_code', 'product_name', 'velocity_class', 'location_code',
    'zone_code', 'location_type', 'lot_number', 'expiry_date',
    'uom_code', 'on_hand', 'allocated', 'reserved', 'available',
  ],
  MOVEMENT_HISTORY: [
    'id', 'timestamp', 'type', 'reference_doc', 'product_code',
    'product_name', 'lot_number', 'location_from', 'location_to',
    'quantity', 'uom_code', 'performed_by',
  ],
  VELOCITY_ABC: [
    'product_code', 'product_name', 'turnover', 'cumulative_pct', 'velocity_class',
  ],
  AGING_ANALYSIS: [
    'product_code', 'product_name', 'lot_number', 'received_date',
    'days_aged', 'age_bucket', 'qty_on_hand', 'expiry_date', 'expiry_status',
  ],
};

@Processor('wms-reports', { concurrency: 2 })
@Injectable()
export class ReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly excelStreamer: ExcelStreamerService,
    private readonly csvStreamer: CsvStreamerService,
    private readonly s3Upload: S3UploadService,
    private readonly reportLock: ReportLockService,
    private readonly timezone: TimezoneService,
    private readonly wmsNotification: WmsNotificationClientService,
    private readonly stockOnHand: StockOnHandService,
    private readonly movementHistory: MovementHistoryService,
    private readonly velocityAbc: VelocityAbcService,
    private readonly aging: AgingService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly eventEmitter: EventEmitter2,
    private readonly config: ConfigService,
    @InjectQueue('wms-reports-dlq') private readonly dlqQueue: Queue,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const data = (job.data || {}) as Record<string, any>;
    const jobId = data.jobId as string;
    const tenantId = data.tenantId as string;
    if (!jobId || !tenantId) {
      this.logger.error(`Job ${job.id} missing jobId or tenantId in data`);
      return;
    }

    const lockAcquired = await this.reportLock.acquire(job.id || jobId, 600);
    if (!lockAcquired) {
      throw new Error(`Unable to acquire lock for job ${job.id || jobId}`);
    }

    try {
      const dbJob = await (this.prisma as any).wmsReportJob.findUnique({ where: { id: jobId } });
      if (!dbJob || dbJob.status !== ReportStatus.PENDING) {
        this.logger.warn(`Job ${jobId} not found or not PENDING — skipping`);
        return;
      }

      await (this.prisma as any).wmsReportJob.update({
        where: { id: jobId },
        data: { status: ReportStatus.GENERATING },
      });

      const reportType: ReportType = dbJob.reportType as ReportType;
      const extractor = this.getExtractor(reportType);
      const params = { ...(dbJob.parameters as any) };
      params.timezone = await this.timezone.getDefaultTimezone(tenantId);

      const generator: AsyncGenerator<Record<string, any>> = extractor.extract(params, tenantId);
      const headers = HEADERS[reportType];

      if (!headers) {
        throw new Error(`Unknown report type: ${reportType}`);
      }

      const format = params.format || 'xlsx';
      const s3Enabled = this.config.get<string>('S3_BUCKET');
      const key = `reports/${tenantId}/${jobId}.${format === 'csv' || params.liveQuery ? 'csv' : 'xlsx'}`;
      let rowCount = 0;
      let fileSizeBytes = 0;
      let downloadUrl: string | null = null;

      if (format === 'csv' || params.liveQuery) {
        const csvString = await this.csvStreamer.streamToCsv(generator, headers);
        const buffer = Buffer.from(csvString, 'utf-8');
        fileSizeBytes = buffer.byteLength;
        rowCount = Math.max(0, csvString.split('\n').length - 1);

        if (s3Enabled) {
          const uploadedKey = await this.s3Upload.uploadBuffer(key, buffer, 'text/csv');
          if (uploadedKey) {
            downloadUrl = uploadedKey;
          }
        } else {
          const dir = '/tmp/wms-reports';
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          const filePath = path.join(dir, `${jobId}.csv`);
          fs.writeFileSync(filePath, buffer);
          downloadUrl = filePath;
        }

        let count = 0;
        for await (const _ of generator) {
          count++;
        }
        rowCount = count;
      } else {
        const result = await this.excelStreamer.streamToExcel(jobId, generator, headers, tenantId);
        rowCount = result.rowCount;
        fileSizeBytes = result.sizeBytes;

        const dir = '/tmp/wms-reports';
        const tempPath = path.join(dir, `${jobId}.xlsx`);

        if (s3Enabled) {
          const buffer = fs.readFileSync(tempPath);
          const uploadedKey = await this.s3Upload.uploadBuffer(key, buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          if (uploadedKey) {
            downloadUrl = uploadedKey;
          }
          fs.unlinkSync(tempPath);
        } else {
          downloadUrl = tempPath;
        }
      }

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const completedAt = new Date();

      await (this.prisma as any).wmsReportJob.update({
        where: { id: jobId },
        data: {
          status: ReportStatus.COMPLETED,
          rowCount,
          fileSizeBytes,
          downloadUrl,
          expiresAt,
          completedAt,
        },
      });

      const today = new Date().toISOString().split('T')[0];
      const metricKey = `${REPORT_METRICS_PREFIX}${tenantId}:${today}`;
      await this.redis.hincrby(metricKey, 'generated', 1);

      this.eventEmitter.emit('report.completed', { jobId, tenantId, reportType, rowCount, fileSizeBytes });

      try {
        const vars: Record<string, any> = {
          reportType,
          jobId,
          rowCount,
          fileSizeMb: fileSizeBytes > 0 ? +(fileSizeBytes / 1048576).toFixed(2) : 0,
          downloadUrl: downloadUrl || '',
        };
        await this.wmsNotification.dispatch({
          type: 'wms.report_ready',
          tenantId,
          recipients: [{ userId: dbJob.createdByUserId || '' }],
          variables: vars,
          priority: 'low',
        });
      } catch {
        // REPORT_READY notification type not yet registered — skip
      }

      await this.reportLock.release(job.id || jobId);
    } catch (err) {
      await this.reportLock.release(job.id || jobId);
      throw err;
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, err: Error): Promise<void> {
    const data = (job.data || {}) as Record<string, any>;
    const jobId = data.jobId as string;
    const tenantId = data.tenantId as string;

    if (!jobId) {
      this.logger.error(`Failed job ${job.id} has no jobId in data`);
      return;
    }

    const sanitized = this.sanitizeError(err.message);

    try {
      await (this.prisma as any).wmsReportJob.update({
        where: { id: jobId },
        data: {
          status: ReportStatus.FAILED,
          errorMessage: sanitized,
        },
      });

      const today = new Date().toISOString().split('T')[0];
      const metricKey = `${REPORT_METRICS_PREFIX}${tenantId}:${today}`;
      await this.redis.hincrby(metricKey, 'failed', 1);

      if (job.attemptsMade >= 2) {
        await this.dlqQueue.add('report-dlq', {
          jobId,
          tenantId,
          error: sanitized,
        });
        this.logger.warn(`Moved job ${jobId} to DLQ after ${job.attemptsMade} attempts`);
      }
    } catch (dbErr) {
      this.logger.error(`Failed to update job ${jobId} status: ${(dbErr as Error).message}`);
    }

    try {
      await this.reportLock.release(job.id || jobId);
    } catch {
      // best-effort lock release
    }
  }

  private getExtractor(reportType: ReportType) {
    switch (reportType) {
      case ReportType.STOCK_ON_HAND:
        return this.stockOnHand;
      case ReportType.MOVEMENT_HISTORY:
        return this.movementHistory;
      case ReportType.VELOCITY_ABC:
        return this.velocityAbc;
      case ReportType.AGING_ANALYSIS:
        return this.aging;
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }

  private sanitizeError(message: string): string {
    const patterns = [
      /(password|secret|token|apikey|authorization)\s*[=:]\s*\S+/gi,
      /(-----BEGIN[^-]+-----)[\s\S]+?(-----END[^-]+-----)/g,
      /(accessKeyId|secretAccessKey|sessionToken)\s*[=:]\s*['"][^'"]+['"]/gi,
    ];
    let sanitized = message;
    for (const pattern of patterns) {
      sanitized = sanitized.replace(pattern, '$1=***');
    }
    return sanitized.substring(0, 2000);
  }
}
