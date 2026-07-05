import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { ShutdownService } from './shutdown.service';
import { ShutdownDrainMiddleware } from './shutdown-drain.middleware';

@Global()
@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue(
      { name: 'asn-import' },
      { name: 'auto-approval-processor' },
      { name: 'workflow-recovery' },
      { name: 'report-generation' },
      { name: 'quota-sync-retry' },
    ),
  ],
  providers: [ShutdownService, ShutdownDrainMiddleware],
  exports: [ShutdownService, ShutdownDrainMiddleware],
})
export class LifecycleModule {}
