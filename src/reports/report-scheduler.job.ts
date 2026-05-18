import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { QueueDepthMonitorService } from './queue-depth-monitor.service';
import { WmsNotificationClientService } from '../notifications/wms-notification-client.service';
import { ReportType, ReportStatus } from './report.types';
import { v4 as uuidv4 } from 'uuid';

const SCHEDULE_KEYS = [
  'report_schedule_stock_on_hand',
  'report_schedule_movement_history',
  'report_schedule_velocity_abc',
  'report_schedule_aging_analysis',
];

const KEY_TO_REPORT_TYPE: Record<string, ReportType> = {
  report_schedule_stock_on_hand: ReportType.STOCK_ON_HAND,
  report_schedule_movement_history: ReportType.MOVEMENT_HISTORY,
  report_schedule_velocity_abc: ReportType.VELOCITY_ABC,
  report_schedule_aging_analysis: ReportType.AGING_ANALYSIS,
};

@Injectable()
export class ReportSchedulerJob {
  private readonly logger = new Logger(ReportSchedulerJob.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('wms-reports') private readonly reportsQueue: Queue,
    private readonly config: ConfigService,
    private readonly queueDepthMonitor: QueueDepthMonitorService,
    private readonly wmsNotification: WmsNotificationClientService,
  ) {}

  @Cron('0 6 * * *')
  async runDailySchedules(): Promise<void> {
    const overloaded = await this.queueDepthMonitor.isOverloaded();
    if (overloaded) {
      this.logger.warn('Queue is overloaded — skipping daily schedule run');
      return;
    }

    const schedules = await (this.prisma as any).systemSetting.findMany({
      where: { settingKey: { in: SCHEDULE_KEYS } },
    });

    if (!schedules.length) {
      this.logger.log('No report schedules found');
      return;
    }

    const tenantSchedules = new Map<string, Map<string, any>>();
    for (const s of schedules) {
      if (!tenantSchedules.has(s.tenantId)) {
        tenantSchedules.set(s.tenantId, new Map());
      }
      tenantSchedules.get(s.tenantId)!.set(s.settingKey, s.value);
    }

    const tenants = Array.from(tenantSchedules.keys());
    const totalTenants = tenants.length;

    let scheduledCount = 0;

    for (let index = 0; index < totalTenants; index++) {
      const tenantId = tenants[index];
      const schedulesForTenant = tenantSchedules.get(tenantId)!;

      for (const [key, value] of schedulesForTenant) {
        const config = value as Record<string, any>;
        if (!config.enabled) continue;

        const reportType = KEY_TO_REPORT_TYPE[key];
        if (!reportType) continue;

        const delayMs = Math.min((index % 100) * 18 * 1000, 30 * 60 * 1000);
        const jobId = uuidv4();

        const params: Record<string, any> = {};
        if (config.format) params.format = config.format;
        if (config.liveQuery) params.liveQuery = config.liveQuery;
        if (config.thresholdDays) params.thresholdDays = config.thresholdDays;
        if (config.dateFrom) params.dateFrom = config.dateFrom;
        if (config.dateTo) params.dateTo = config.dateTo;

        await (this.prisma as any).wmsReportJob.create({
          data: {
            id: jobId,
            tenantId,
            reportType,
            status: ReportStatus.PENDING,
            parameters: params,
          },
        });

        await this.reportsQueue.add('report-generation', {
          jobId,
          tenantId,
        }, {
          delay: delayMs,
          removeOnComplete: true,
          removeOnFail: false,
        });

        scheduledCount++;
      }
    }

    this.logger.log(`Scheduled ${scheduledCount} reports for ${totalTenants} tenants`);
  }
}
