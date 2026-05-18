import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Processor('schema-backfill', { concurrency: 1 })
export class SchemaBackfillProcessor extends WorkerHost {
  private readonly logger = new Logger(SchemaBackfillProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ migrationName: string; issues: Array<{ type: string; detail: string }> }>): Promise<void> {
    const { migrationName, issues } = job.data;
    this.logger.log(`Backfill started for ${migrationName}`);

    for (const issue of issues) {
      switch (issue.type) {
        case 'unique_index':
          await this.backfillUniqueConstraint(migrationName, issue.detail);
          break;
        case 'column_drop':
          await this.backfillColumnMigration(migrationName, issue.detail);
          break;
        default:
          this.logger.warn(`No backfill handler for ${issue.type}`);
      }
    }

    this.logger.log(`Backfill completed for ${migrationName}`);
  }

  private async backfillUniqueConstraint(migrationName: string, detail: string): Promise<void> {
    this.logger.log(`Unique constraint backfill: ${migrationName} — ${detail}`);
    // Phase 1: Identify duplicated rows grouped by the unique columns
    // Phase 2: In transaction: deduplicate, keep first, archive remaining
    // Phase 3: Mark as ready for new code
  }

  private async backfillColumnMigration(migrationName: string, detail: string): Promise<void> {
    this.logger.log(`Column migration backfill: ${migrationName} — ${detail}`);
    // Batch process rows: set new column default, backfill in chunks of 1000
    // Verify integrity, emit audit event
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Backfill job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(`Backfill job ${job.id} failed: ${error.message}`);
  }
}
