import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

const BREAKING_PATTERNS = ['@@unique', '@@index', 'drop', 'rename'];

@Injectable()
export class SchemaVersioningService {
  private readonly logger = new Logger(SchemaVersioningService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue('schema-backfill') private readonly backfillQueue: Queue,
  ) {}

  async getPendingMigrations(): Promise<Array<{ migration_name: string; checksum: string }>> {
    const results = await this.prisma.$queryRawUnsafe<
      Array<{ migration_name: string; checksum: string }>
    >(
      `SELECT migration_name, checksum FROM _prisma_migrations
       WHERE finished_at IS NULL
       ORDER BY started_at`,
    );
    return results;
  }

  async detectBreakingChanges(migrationSql: string): Promise<Array<{ type: string; detail: string }>> {
    const issues: Array<{ type: string; detail: string }> = [];
    const upper = migrationSql.toUpperCase();

    for (const pattern of BREAKING_PATTERNS) {
      if (pattern === 'drop' && upper.includes('ALTER TABLE') && upper.includes('DROP')) {
        issues.push({ type: 'column_drop', detail: 'DROP COLUMN detected — requires phased rollout' });
      }
      if (pattern === 'rename' && upper.includes('ALTER TABLE') && upper.includes('RENAME')) {
        issues.push({ type: 'rename', detail: 'RENAME detected — requires backward-compat view' });
      }
      if (pattern === '@@unique') {
        const match = migrationSql.match(/CREATE\s+UNIQUE\s+INDEX/i);
        if (match) {
          issues.push({ type: 'unique_index', detail: 'New unique constraint — verify data dedup before apply' });
        }
      }
      if (pattern === '@@index') {
        const match = migrationSql.match(/CREATE\s+INDEX\s+(?!UNIQUE)/i);
        if (match) {
          issues.push({ type: 'index', detail: 'New index — safe additive change' });
        }
      }
    }

    return issues;
  }

  async enqueueBackfill(migrationName: string, issues: Array<{ type: string; detail: string }>): Promise<void> {
    const needsBackfill = issues.some((i) => i.type === 'unique_index' || i.type === 'column_drop');
    if (!needsBackfill) return;

    await this.backfillQueue.add(
      'schema-backfill',
      { migrationName, issues },
      {
        jobId: `schema-backfill:${migrationName}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 30000 },
        removeOnComplete: { age: 86400 },
      },
    );

    this.logger.log(`Backfill enqueued for ${migrationName}: ${issues.map((i) => i.type).join(', ')}`);
  }

  @Cron('*/15 * * * * *')
  async checkBackfillStatus(): Promise<void> {
    try {
      const counts = await this.backfillQueue.getJobCounts('waiting', 'active');
      if (counts.waiting > 0 || counts.active > 0) {
        this.logger.warn(`Backfill in progress: ${counts.waiting} waiting, ${counts.active} active`);
      }
    } catch {
      // queue not available in dev
    }
  }
}
