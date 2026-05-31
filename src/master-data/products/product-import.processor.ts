import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { BarcodeService } from './barcode.service';

export const PRODUCT_IMPORT_QUEUE = 'product-import';

interface ImportJobData {
  jobId: string;
  tenantId: string;
  fileBuffer: string;
  fileName: string;
}

interface RowResult {
  rowNum: number;
  productCode: string;
  status: string;
  errorMessage?: string;
  classification?: 'ERROR' | 'WARN';
}

@Processor(PRODUCT_IMPORT_QUEUE, { concurrency: 3 })
export class ProductImportProcessor extends WorkerHost {
  private readonly logger = new Logger(ProductImportProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly barcodeService: BarcodeService,
  ) {
    super();
  }

  async process(job: Job<ImportJobData>): Promise<void> {
    const { jobId, tenantId, fileBuffer, fileName } = job.data;

    await (this.prisma as any).productImportJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    });

    const results: RowResult[] = [];
    let successCount = 0;
    let failedCount = 0;
    let processedCount = 0;

    try {
      // Parse file — for CSV, split by lines (Excel would use exceljs)
      const content = Buffer.from(fileBuffer, 'base64').toString('utf-8');
      const lines = content.split('\n').filter((l) => l.trim());

      if (lines.length < 2) {
        throw new Error('File is empty or has no data rows');
      }

      const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const totalRows = lines.length - 1;

      await (this.prisma as any).productImportJob.update({
        where: { id: jobId },
        data: { totalRows },
      });

      // Challenge 2: Track in-file dedup
      const seenProductCodes = new Map<string, number[]>(); // code → row numbers

      for (let i = 1; i < lines.length; i++) {
        const rowNum = i; // 1-indexed data row
        const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));

        try {
          // Parse CSV columns
          const productCode = values[0] || '';
          const name = values[1] || '';
          const categoryCode = values[2] || '';
          const baseUomCode = values[3] || 'EA';
          const barcode1 = values[4] || '';
          const barcode2 = values[5] || '';

          // Validate product code
          if (!productCode) {
            results.push({ rowNum, productCode: '', status: 'FAILED', errorMessage: 'Product code is required' });
            failedCount++;
            processedCount++;
            continue;
          }

          // Challenge 2: In-file dedup tracking
          const dupeRows = seenProductCodes.get(productCode) || [];
          if (dupeRows.length > 0) {
            results.push({
              rowNum,
              productCode,
              status: 'SKIPPED',
              errorMessage: `Duplicate productCode "${productCode}" — first seen at row ${dupeRows[0]}`,
            });
            failedCount++;
            processedCount++;
            continue;
          }
          seenProductCodes.set(productCode, [...dupeRows, rowNum]);

          // Resolve category by code
          const category = await (this.prisma as any).productCategory.findFirst({
            where: { tenantId, categoryCode },
          });
          if (!category) {
            // Challenge 2: Continue on error, accumulate warning
            results.push({ rowNum, productCode, status: 'FAILED', errorMessage: `Category "${categoryCode}" not found` });
            failedCount++;
            processedCount++;
            continue;
          }

          // Resolve UOM by code
          let uom = await (this.prisma as any).unitOfMeasure.findFirst({
            where: { tenantId, code: baseUomCode },
          });
          if (!uom) {
            // Fallback to EA
            uom = await (this.prisma as any).unitOfMeasure.findFirst({
              where: { tenantId, code: 'EA' },
            });
            if (!uom) {
              results.push({ rowNum, productCode, status: 'FAILED', errorMessage: `UOM "${baseUomCode}" not found and no EA fallback` });
              failedCount++;
              processedCount++;
              continue;
            }
          }

          // Upsert product
          let product = await (this.prisma as any).product.findFirst({
            where: { tenantId, productCode },
          });

          if (product) {
            // Update existing
            product = await (this.prisma as any).product.update({
              where: { id: product.id },
              data: { name, categoryId: category.id, baseUomId: uom.id },
            });
            results.push({ rowNum, productCode, status: 'SUCCESS', errorMessage: 'Updated existing product' });
          } else {
            product = await (this.prisma as any).product.create({
              data: {
                tenantId,
                categoryId: category.id,
                baseUomId: uom.id,
                productCode,
                name,
              },
            });

            // Quota increment
            await (this.prisma as any).$executeRawUnsafe(
              `UPDATE multitenant.resource_quotas
               SET current_usage = current_usage + 1, updated_at = NOW()
               WHERE tenant_id = $1::uuid AND resource_type = 'products'
                 AND current_usage < limit_amount`,
              tenantId,
            );

            results.push({ rowNum, productCode, status: 'SUCCESS' });
          }

          // Create barcodes if provided
          const allBarcodes = [barcode1, barcode2].filter(Boolean);
          for (const bc of allBarcodes) {
            const exists = await (this.prisma as any).productBarcode.findFirst({
              where: { barcodeValue: bc },
            });
            if (!exists) {
              await (this.prisma as any).productBarcode.create({
                data: {
                  tenantId,
                  productId: product.id,
                  barcodeValue: bc,
                  isPrimary: bc === barcode1,
                },
              });
            } else {
              results.push({ rowNum, productCode, status: 'WARN', errorMessage: `Barcode "${bc}" already exists in system` });
            }
          }

          successCount++;
        } catch (rowErr: any) {
          results.push({
            rowNum,
            productCode: values?.[0] || '',
            status: 'FAILED',
            errorMessage: rowErr.message,
          });
          failedCount++;
        }

        processedCount++;

        // Batch save results every 100 rows
        if (results.length >= 100) {
          await (this.prisma as any).productImportResult.createMany({
            data: results.map((r) => ({
              tenantId,
              jobId,
              rowNum: r.rowNum,
              productCode: r.productCode,
              status: r.status,
              errorMessage: r.errorMessage,
            })),
          });
          results.length = 0;
        }

        // Update progress
        if (i % 100 === 0) {
          await (this.prisma as any).productImportJob.update({
            where: { id: jobId },
            data: { processedRows: processedCount, successRows: successCount, failedRows: failedCount },
          });
        }
      }

      // Flush remaining results
      if (results.length > 0) {
        await (this.prisma as any).productImportResult.createMany({
          data: results.map((r) => ({
            tenantId,
            jobId,
            rowNum: r.rowNum,
            productCode: r.productCode,
            status: r.status,
            errorMessage: r.errorMessage,
          })),
        });
      }

      const finalStatus = failedCount > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED';
      const errorSummary = failedCount > 0
        ? `${failedCount} of ${totalRows} rows failed. Check results for details.`
        : null;

      await (this.prisma as any).productImportJob.update({
        where: { id: jobId },
        data: {
          status: finalStatus,
          processedRows: totalRows,
          successRows: successCount,
          failedRows: failedCount,
          errorSummary,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Import job ${jobId} completed: ${successCount} success, ${failedCount} failed`);
    } catch (err: any) {
      this.logger.error(`Import job ${jobId} failed: ${err.message}`);
      await (this.prisma as any).productImportJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', errorSummary: err.message, completedAt: new Date() },
      });
      throw err;
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Import job ${job.id} permanently failed: ${err.message}`);
  }
}
