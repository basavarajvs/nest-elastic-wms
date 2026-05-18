import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RedisPubSubService } from './redis-pubsub.service';
import { MigrationLockService } from './migration-lock.service';
import { MigrationStatusService } from './migration-status.service';
import { SchemaVersioningService } from './schema-versioning.service';
import { StaleLockReaperService } from './stale-lock-reaper.service';
import { JwtValidationService } from './jwt-validation.service';
import { ConnectionPoolWarmerService } from './connection-pool-warmer.service';
import { HealthProbeService } from './health-probe.service';
import { SchemaBackfillProcessor } from './schema-backfill.processor';

export const SCHEMA_BACKFILL_QUEUE = 'schema-backfill';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: SCHEMA_BACKFILL_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 30000 },
        removeOnComplete: { age: 86400, count: 100 },
        removeOnFail: { age: 604800, count: 50 },
      },
    }),
  ],
  providers: [
    RedisPubSubService,
    MigrationLockService,
    MigrationStatusService,
    SchemaVersioningService,
    StaleLockReaperService,
    JwtValidationService,
    ConnectionPoolWarmerService,
    HealthProbeService,
    SchemaBackfillProcessor,
  ],
  exports: [
    RedisPubSubService,
    MigrationLockService,
    MigrationStatusService,
    SchemaVersioningService,
    StaleLockReaperService,
    JwtValidationService,
    ConnectionPoolWarmerService,
    HealthProbeService,
  ],
})
export class ClusterModule {}
