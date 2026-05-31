import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';

interface MigrationRecord {
  migration_name: string;
  started_at: Date;
  finished_at: Date | null;
  status: string;
  rollback_script_url: string | null;
}

@Injectable()
export class MigrationStatusService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MigrationStatusService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.ensureMigrationStatusTable();
    this.logger.log('Migration status table ensured');
  }

  async ensureMigrationStatusTable(): Promise<void> {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS wms_migration_status (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        finished_at TIMESTAMPTZ,
        status VARCHAR(50) NOT NULL DEFAULT 'running',
        rollback_script_url TEXT,
        error_log TEXT,
        lock_holder_pid INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  async startMigration(migrationName: string, rollbackUrl?: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO wms_migration_status (migration_name, status, rollback_script_url, lock_holder_pid)
       VALUES ($1, 'running', $2, pg_backend_pid())
       ON CONFLICT (migration_name) DO UPDATE SET
         status = 'running',
         lock_holder_pid = pg_backend_pid(),
         updated_at = NOW()`,
      migrationName,
      rollbackUrl || null,
    );
    this.logger.log(`Migration ${migrationName} started (PID: ${process.pid})`);
  }

  async completeMigration(migrationName: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `UPDATE wms_migration_status SET
         status = 'completed',
         finished_at = NOW(),
         updated_at = NOW()
       WHERE migration_name = $1`,
      migrationName,
    );
    this.logger.log(`Migration ${migrationName} completed`);
  }

  async failMigration(migrationName: string, error: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `UPDATE wms_migration_status SET
         status = 'failed',
         finished_at = NOW(),
         error_log = $2,
         updated_at = NOW()
       WHERE migration_name = $1`,
      migrationName,
      error,
    );
    this.logger.error(`Migration ${migrationName} FAILED: ${error}`);
  }

  async getRunningMigrations(): Promise<MigrationRecord[]> {
    const results = await this.prisma.$queryRawUnsafe<MigrationRecord[]>(
      `SELECT migration_name, started_at, finished_at, status, rollback_script_url
       FROM wms_migration_status
       WHERE status = 'running'
       ORDER BY started_at`,
    );
    return results;
  }

  async getStuckMigrations(): Promise<MigrationRecord[]> {
    const results = await this.prisma.$queryRawUnsafe<MigrationRecord[]>(
      `SELECT migration_name, started_at, finished_at, status, rollback_script_url
       FROM wms_migration_status
       WHERE status = 'running' AND started_at < NOW() - INTERVAL '30 minutes'
       ORDER BY started_at`,
    );
    return results;
  }

  @Cron('*/5 * * * *')
  async detectStuckMigrations(): Promise<void> {
    try {
      const stuck = await this.getStuckMigrations();
      for (const m of stuck) {
        this.logger.error(`Stuck migration detected: ${m.migration_name} running since ${m.started_at}`);
      }
    } catch (err: any) {
      this.logger.debug(`Migration status check skipped: ${err.message}`);
    }
  }
}
