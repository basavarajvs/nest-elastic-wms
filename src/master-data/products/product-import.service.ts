import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BarcodeService } from './barcode.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PRODUCT_IMPORT_QUEUE } from './product-import.processor';

@Injectable()
export class ProductImportService {
  private readonly logger = new Logger(ProductImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly barcodeService: BarcodeService,
    @InjectQueue(PRODUCT_IMPORT_QUEUE) private readonly importQueue: Queue,
  ) {}

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    tenantId: string,
  ): Promise<{ jobId: string; status: string }> {
    if (!fileName.match(/\.(xlsx|csv)$/i)) {
      throw new Error('Only .xlsx and .csv files are supported');
    }

    if (fileBuffer.length > 50 * 1024 * 1024) {
      throw new Error('File exceeds 50MB maximum size');
    }

    const job = await (this.prisma as any).productImportJob.create({
      data: {
        tenantId,
        fileName,
        status: 'PENDING',
      },
    });

    await this.importQueue.add('import', {
      jobId: job.id,
      tenantId,
      fileBuffer: fileBuffer.toString('base64'),
      fileName,
    });

    this.logger.log(`Import job ${job.id} queued for tenant ${tenantId}: ${fileName}`);
    return { jobId: job.id, status: 'QUEUED' };
  }

  async getJobStatus(jobId: string, tenantId: string) {
    const job = await (this.prisma as any).productImportJob.findFirst({
      where: { id: jobId, tenantId },
      include: {
        results: {
          where: { status: { in: ['FAILED', 'SKIPPED'] } },
          select: { rowNum: true, productCode: true, status: true, errorMessage: true },
          orderBy: { rowNum: 'asc' },
        },
      },
    });

    if (!job) throw new Error('Import job not found');

    const progress = job.totalRows > 0
      ? Math.round((job.processedRows / job.totalRows) * 100)
      : 0;

    return {
      id: job.id,
      fileName: job.fileName,
      status: job.status,
      progress,
      totalRows: job.totalRows,
      processedRows: job.processedRows,
      successRows: job.successRows,
      failedRows: job.failedRows,
      errorSummary: job.errorSummary,
      completedAt: job.completedAt,
      createdAt: job.createdAt,
      errors: job.results,
    };
  }

  async generateErrorCsv(jobId: string, tenantId: string): Promise<string> {
    const job = await (this.prisma as any).productImportJob.findFirst({
      where: { id: jobId, tenantId },
      include: {
        results: {
          where: { status: { in: ['FAILED', 'SKIPPED', 'WARN'] } },
          orderBy: { rowNum: 'asc' },
        },
      },
    });

    if (!job) throw new Error('Import job not found');

    const header = 'Row,ProductCode,Status,Classification,ErrorMessage\n';
    const rows = job.results.map((r: any) =>
      `"${r.rowNum}","${r.productCode || ''}","${r.status}","${r.status === 'WARN' ? 'WARN' : 'ERROR'}","${(r.errorMessage || '').replace(/"/g, '""')}"`,
    ).join('\n');

    return header + rows;
  }
}
