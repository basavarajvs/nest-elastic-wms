import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from './reports.service';

const REPORT_GENERATORS: Record<string, string> = {
  INVENTORY_AGING: 'generateInventoryAgingReport',
  PICK_HEATMAP: 'generatePickHeatmapReport',
  CYCLE_COUNT_ACCURACY: 'generateCycleCountAccuracyReport',
};

@Processor('report-generation')
export class ReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(
    private readonly reportsService: ReportsService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    this.logger.log(`Processing report generation job ${job.id}`);

    const { jobId, tenantId, reportType, parameters } = job.data;

    try {
      const generator = REPORT_GENERATORS[reportType];
      if (!generator) {
        throw new Error(`Unknown report type: ${reportType}`);
      }

      let data: any[];
      switch (reportType) {
        case 'INVENTORY_AGING':
          data = await this.reportsService.generateInventoryAgingReport(tenantId, parameters?.facilityId);
          break;
        case 'PICK_HEATMAP':
          data = await this.reportsService.generatePickHeatmapReport(tenantId, parameters?.facilityId, parameters?.days);
          break;
        case 'CYCLE_COUNT_ACCURACY':
          data = await this.reportsService.generateCycleCountAccuracyReport(tenantId, parameters?.facilityId);
          break;
        default:
          data = [];
      }

      const rowCount = data.length;
      const downloadUrl = `/api/v1/wms/reports/jobs/${jobId}/download`;

      await this.reportsService.updateJob(jobId, 'COMPLETED', {
        downloadUrl,
        rowCount,
      });

      this.logger.log(`Report job ${jobId} completed: ${rowCount} rows`);
      return { status: 'completed', rowCount };
    } catch (err: any) {
      this.logger.error(`Report job ${jobId} failed: ${err.message}`);
      await this.reportsService.updateJob(jobId, 'FAILED', { errorMessage: err.message });
      throw err;
    }
  }
}
