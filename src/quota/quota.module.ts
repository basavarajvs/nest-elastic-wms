import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { QuotaInitService } from './quota-init.service';
import { QuotaSyncRetryProcessor } from './quota-sync-retry.processor';
import { QUOTA_SYNC_QUEUE } from './quota-sync.constants';

@Global()
@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    BullModule.registerQueue({ name: QUOTA_SYNC_QUEUE }),
  ],
  providers: [QuotaInitService, QuotaSyncRetryProcessor],
  exports: [QuotaInitService],
})
export class QuotaModule {}
