import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ExcelStreamerService {
  async streamToExcel(
    jobId: string,
    generator: AsyncGenerator<Record<string, any>>,
    headers: string[],
    tenantId: string,
  ): Promise<{ rowCount: number; sizeBytes: number }> {
    const dir = '/tmp/wms-reports';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, `${jobId}.xlsx`);

    const writeStream = fs.createWriteStream(filePath);
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: writeStream,
      useStyles: false,
      useSharedStrings: false,
    });
    const worksheet = workbook.addWorksheet('Report');

    worksheet.columns = headers.map((h) => ({
      header: h,
      key: h,
      width: this.getColumnWidth(h),
    }));

    let rowCount = 0;

    for await (const row of generator) {
      worksheet.addRow(row).commit();
      rowCount++;
    }

    worksheet.commit();
    await workbook.commit();
    await new Promise<void>((resolve, reject) => {
      writeStream.end(() => resolve());
      writeStream.on('error', reject);
    });

    const stats = fs.statSync(filePath);
    return { rowCount, sizeBytes: stats.size };
  }

  async streamToExcelBuffer(
    generator: AsyncGenerator<Record<string, any>>,
    headers: string[],
  ): Promise<Buffer> {
    const chunks: Buffer[] = [];
    const bufferStream = new (require('stream').Writable)({
      write(chunk: Buffer, encoding: string, callback: Function) {
        chunks.push(chunk);
        callback();
      },
    });

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: bufferStream,
      useStyles: false,
      useSharedStrings: false,
    });
    const worksheet = workbook.addWorksheet('Live');

    worksheet.columns = headers.map((h) => ({
      header: h,
      key: h,
      width: 20,
    }));

    for await (const row of generator) {
      worksheet.addRow(row).commit();
    }

    worksheet.commit();
    await workbook.commit();
    return Buffer.concat(chunks);
  }

  private getColumnWidth(name: string): number {
    const lower = name.toLowerCase();
    if (lower.includes('product') || lower.includes('code') || lower.includes('sku')) {
      return 24;
    }
    return 20;
  }
}
