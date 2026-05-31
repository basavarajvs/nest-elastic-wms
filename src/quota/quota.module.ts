import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QuotaInitService } from './quota-init.service';
import { QuotaGuard } from '../common/guards/quota.guard';
import { QUOTA_SYNC_QUEUE } from './quota-sync.constants';

@Global()
@Module({
  imports: [BullModule.registerQueue({ name: QUOTA_SYNC_QUEUE })],
  providers: [QuotaInitService, QuotaGuard],
  exports: [QuotaInitService, QuotaGuard, BullModule],
})
export class QuotaModule {}
