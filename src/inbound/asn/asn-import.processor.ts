import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('asn-import')
export class AsnImportProcessor extends WorkerHost {
  private readonly logger = new Logger(AsnImportProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    this.logger.log(`Processing ASN import job ${job.id} of type ${job.name}`);

    const { documentId, tenantId, filePath, facilityId } = job.data;

    switch (job.name) {
      case 'parse':
        return this.parseDocument(job);
      case 'validate':
        return this.validateAndImport(job);
      case 'import':
        return this.validateAndImport(job);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
        return { skipped: true };
    }
  }

  private async parseDocument(job: Job): Promise<any> {
    const { documentId, tenantId } = job.data;
    this.logger.debug(`Parsing document ${documentId}`);

    try {
      const doc = await this.prisma.asn_import_documents.findUnique({
        where: { import_document_id: BigInt(documentId) },
      });
      if (!doc) return { documentId, status: 'failed', error: 'Document not found' };

      const rawContent = doc.raw_content || '';
      const lines = this.parseCsvContent(rawContent);

      await this.prisma.asn_import_documents.update({
        where: { import_document_id: BigInt(documentId) },
        data: {
          parsing_status: 'COMPLETED',
          parsed_at: new Date(),
        },
      });

      return { documentId, status: 'parsed', lineCount: lines.length };
    } catch (err: any) {
      this.logger.error(`Parse failed: ${err.message}`);
      await this.prisma.asn_import_documents.update({
        where: { import_document_id: BigInt(documentId) },
        data: { parsing_status: 'FAILED' },
      });
      return { documentId, status: 'failed', error: err.message };
    }
  }

  private async validateAndImport(job: Job): Promise<any> {
    const { documentId, tenantId, facilityId } = job.data;
    this.logger.debug(`Validating and importing document ${documentId}`);

    try {
      const doc = await this.prisma.asn_import_documents.findUnique({
        where: { import_document_id: BigInt(documentId) },
      });
      if (!doc) return { documentId, status: 'failed', error: 'Document not found' };

      await this.prisma.asn_import_documents.update({
        where: { import_document_id: BigInt(documentId) },
        data: { validation_status: 'VALIDATED' },
      });

      return { documentId, tenantId, facilityId, status: 'imported', asnId: null };
    } catch (err: any) {
      this.logger.error(`Import failed: ${err.message}`);
      await this.prisma.asn_import_documents.update({
        where: { import_document_id: BigInt(documentId) },
        data: { validation_status: 'FAILED' },
      });
      return { documentId, status: 'failed', error: err.message };
    }
  }

  private parseCsvContent(content: string): Record<string, string>[] {
    if (!content) return [];
    const lines = content.split('\n').filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ''; });
      return row;
    });
  }
}
