import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, Res, HttpException, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { QuotaCheck } from '../../common/decorators/quota-check.decorator';
import { CaslGuard } from '../../common/guards/casl.guard';
import { QuotaGuard } from '../../common/guards/quota.guard';
import { REDIS_CLIENT } from '../../common/cache/redis.constants';
import { ReportRequestDto } from '../dtos/report.dto';
import { ReportType, ReportStatus, REPORT_QUEUE } from '../report.types';
import { StockOnHandService } from '../stock-on-hand.service';
import { MovementHistoryService } from '../movement-history.service';
import { VelocityAbcService } from '../velocity-abc.service';
import { AgingService } from '../aging.service';
import { ExcelStreamerService } from '../excel-streamer.service';
import { CsvStreamerService } from '../csv-streamer.service';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('WMS-WEB', 'Analytics')
@Controller('web/reports')
@UseGuards(CaslGuard, QuotaGuard)
export class ReportsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly excelStreamer: ExcelStreamerService,
    private readonly csvStreamer: CsvStreamerService,
    private readonly stockOnHandService: StockOnHandService,
    private readonly movementHistoryService: MovementHistoryService,
    private readonly velocityAbcService: VelocityAbcService,
    private readonly agingService: AgingService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectQueue(REPORT_QUEUE) private readonly reportsQueue: Queue,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post('/request')
  @CheckAbility({ action: 'read', subject: 'Report' })
  @QuotaCheck('report_requests')
  async requestReport(@Req() req: any, @Body() dto: ReportRequestDto) {
    const tenantId = req.tenantContext.getTenantId();
    const params = dto.parameters || {};

    if (params.timezone && !Intl.supportedValuesOf('timeZone').includes(params.timezone)) {
      throw new HttpException(`Invalid timezone: ${params.timezone}`, HttpStatus.BAD_REQUEST);
    }

    if (params.dateFrom && params.dateTo && new Date(params.dateFrom) > new Date(params.dateTo)) {
      throw new HttpException('dateFrom must be before dateTo', HttpStatus.BAD_REQUEST);
    }

    if (dto.reportType === ReportType.AGING_ANALYSIS && params.thresholdDays != null && (params.thresholdDays < 1 || params.thresholdDays > 365)) {
      throw new HttpException('thresholdDays must be between 1 and 365', HttpStatus.BAD_REQUEST);
    }

    const job = await (this.prisma as any).wmsReportJob.create({
      data: {
        tenantId,
        reportType: dto.reportType,
        parameters: params,
        status: ReportStatus.PENDING,
      },
    });

    await this.reportsQueue.add('report-generate', { jobId: job.id, tenantId }, { delay: 0 });

    return { jobId: job.id, status: ReportStatus.PENDING };
  }

  @Get('/status/:jobId')
  @CheckAbility({ action: 'read', subject: 'Report' })
  async getStatus(@Param('jobId') jobId: string) {
    const job = await (this.prisma as any).wmsReportJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new HttpException('Report job not found', HttpStatus.NOT_FOUND);
    }
    return {
      status: job.status,
      reportType: job.reportType,
      rowCount: job.rowCount,
      fileSizeBytes: job.fileSizeBytes,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      expiresAt: job.expiresAt,
      parameters: job.parameters,
    };
  }

  @Get('/download/:jobId')
  @CheckAbility({ action: 'read', subject: 'Report' })
  @QuotaCheck('report_exports')
  async downloadCompleted(@Param('jobId') jobId: string, @Res() res: any) {
    const job = await (this.prisma as any).wmsReportJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new HttpException('Report job not found', HttpStatus.NOT_FOUND);
    }
    if (job.status !== ReportStatus.COMPLETED) {
      throw new HttpException(`Report is ${job.status}, not COMPLETED`, HttpStatus.BAD_REQUEST);
    }
    if (job.expiresAt && new Date(job.expiresAt) < new Date()) {
      throw new HttpException('Report has expired', HttpStatus.GONE);
    }

    const ext = job.parameters?.format === 'csv' ? 'csv' : 'xlsx';
    const contentType = ext === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const filename = `report_${jobId}.${ext}`;

    if (job.downloadUrl && job.downloadUrl.startsWith('http')) {
      res.header('Location', job.downloadUrl);
      return res.status(302).send();
    }

    const filePath = path.resolve(job.downloadUrl || `/tmp/wms-reports/${jobId}.${ext}`);
    if (!fs.existsSync(filePath)) {
      throw new HttpException('Report file not found on disk', HttpStatus.NOT_FOUND);
    }

    res.header('Content-Type', contentType);
    res.header('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(filePath, (err: any) => {
      if (!err && filePath.startsWith('/tmp/')) {
        fs.unlink(filePath, () => {});
      }
    });
  }

  @Get('/download')
  @CheckAbility({ action: 'read', subject: 'Report' })
  @QuotaCheck('report_exports')
  async downloadLive(
    @Req() req: any,
    @Res() res: any,
    @Query('reportType') reportType: ReportType,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('facilityId') facilityId: string,
    @Query('zoneId') zoneId: string,
    @Query('productClass') productClass: string,
    @Query('format') format: string,
    @Query('timezone') timezone: string,
    @Query('liveQuery') liveQuery: string,
  ) {
    const tenantId = req.tenantContext.getTenantId();
    const params: any = { dateFrom, dateTo, facilityId, zoneId, productClass, timezone, liveQuery: liveQuery === 'true', format: format || 'csv' };

    const extractorMap: Record<string, any> = {
      [ReportType.STOCK_ON_HAND]: this.stockOnHandService,
      [ReportType.MOVEMENT_HISTORY]: this.movementHistoryService,
      [ReportType.VELOCITY_ABC]: this.velocityAbcService,
      [ReportType.AGING_ANALYSIS]: this.agingService,
    };

    const extractor = extractorMap[reportType];
    if (!extractor) {
      throw new HttpException(`Unsupported report type: ${reportType}`, HttpStatus.BAD_REQUEST);
    }

    const generator = extractor.extract(params, tenantId);
    const first = await generator.next();
    const outputFormat = format || 'csv';

    if (first.done) {
      if (outputFormat === 'csv') {
        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename="live_report.csv"');
        return res.send('');
      }
      const emptyBuffer = Buffer.from('');
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.header('Content-Disposition', 'attachment; filename="live_report.xlsx"');
      return res.send(emptyBuffer);
    }

    const headers = Object.keys(first.value);

    async function* remainingGenerator() {
      yield first.value;
      yield* generator;
    }

    if (outputFormat === 'csv') {
      const csvContent = await this.csvStreamer.streamToCsv(remainingGenerator(), headers);
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', 'attachment; filename="live_report.csv"');
      return res.send(csvContent);
    }

    const tempId = `live_${Date.now()}`;
    await this.excelStreamer.streamToExcel(tempId, remainingGenerator(), headers, tenantId);
    const filePath = `/tmp/wms-reports/${tempId}.xlsx`;
    const buffer = fs.readFileSync(filePath);
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.header('Content-Disposition', 'attachment; filename="live_report.xlsx"');
    res.send(buffer);
    fs.unlinkSync(filePath);
  }

  @Get('/templates/:reportType')
  @CheckAbility({ action: 'read', subject: 'Report' })
  async getTemplate(@Param('reportType') reportType: ReportType) {
    const templates: Record<string, any> = {
      [ReportType.STOCK_ON_HAND]: {
        type: ReportType.STOCK_ON_HAND,
        title: 'Stock on Hand Report',
        parameters: {
          facilityId: { type: 'uuid', required: true, description: 'Facility ID' },
          zoneId: { type: 'uuid', required: false, description: 'Zone ID filter' },
          productClass: { type: 'string', required: false, description: 'Velocity class filter' },
          format: { type: 'enum', values: ['xlsx', 'csv'], required: false, default: 'xlsx' },
          timezone: { type: 'string', required: false, default: 'UTC' },
        },
      },
      [ReportType.MOVEMENT_HISTORY]: {
        type: ReportType.MOVEMENT_HISTORY,
        title: 'Movement History Report',
        parameters: {
          dateFrom: { type: 'date', required: true, description: 'Start date (ISO 8601)' },
          dateTo: { type: 'date', required: true, description: 'End date (ISO 8601)' },
          facilityId: { type: 'uuid', required: true, description: 'Facility ID' },
          format: { type: 'enum', values: ['xlsx', 'csv'], required: false, default: 'xlsx' },
          timezone: { type: 'string', required: false, default: 'UTC' },
        },
      },
      [ReportType.VELOCITY_ABC]: {
        type: ReportType.VELOCITY_ABC,
        title: 'Velocity ABC Analysis Report',
        parameters: {
          dateFrom: { type: 'date', required: true, description: 'Start date (ISO 8601)' },
          dateTo: { type: 'date', required: true, description: 'End date (ISO 8601)' },
          facilityId: { type: 'uuid', required: true, description: 'Facility ID' },
          format: { type: 'enum', values: ['xlsx', 'csv'], required: false, default: 'xlsx' },
        },
      },
      [ReportType.AGING_ANALYSIS]: {
        type: ReportType.AGING_ANALYSIS,
        title: 'Inventory Aging Analysis Report',
        parameters: {
          facilityId: { type: 'uuid', required: true, description: 'Facility ID' },
          thresholdDays: { type: 'number', required: false, default: 90, min: 1, max: 365, description: 'Near-expiry threshold in days' },
          format: { type: 'enum', values: ['xlsx', 'csv'], required: false, default: 'xlsx' },
        },
      },
      [ReportType.DAILY_KPI]: {
        type: ReportType.DAILY_KPI,
        title: 'Daily KPI Report',
        parameters: {
          dateFrom: { type: 'date', required: true, description: 'Start date (ISO 8601)' },
          dateTo: { type: 'date', required: true, description: 'End date (ISO 8601)' },
          facilityId: { type: 'uuid', required: true, description: 'Facility ID' },
          format: { type: 'enum', values: ['xlsx', 'csv'], required: false, default: 'xlsx' },
        },
      },
      [ReportType.LOCATION_UTILIZATION]: {
        type: ReportType.LOCATION_UTILIZATION,
        title: 'Location Utilization Report',
        parameters: {
          facilityId: { type: 'uuid', required: true, description: 'Facility ID' },
          zoneId: { type: 'uuid', required: false, description: 'Zone ID filter' },
          format: { type: 'enum', values: ['xlsx', 'csv'], required: false, default: 'xlsx' },
        },
      },
    };

    const tmpl = templates[reportType];
    if (!tmpl) {
      throw new HttpException(`Unknown report type: ${reportType}`, HttpStatus.NOT_FOUND);
    }
    return tmpl;
  }
}
