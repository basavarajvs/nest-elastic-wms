import { Injectable } from '@nestjs/common';
import { stringify } from 'csv-stringify/sync';

@Injectable()
export class CsvStreamerService {
  async streamToCsv(
    generator: AsyncGenerator<Record<string, any>>,
    headers: string[],
  ): Promise<string> {
    const rows: Record<string, any>[] = [];

    for await (const row of generator) {
      rows.push(row);
    }

    return stringify(rows, {
      header: true,
      columns: headers,
      quoted: true,
    });
  }
}
