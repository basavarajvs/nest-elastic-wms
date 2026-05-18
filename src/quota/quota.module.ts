import { Global, Module } from '@nestjs/common';
import { QuotaInitService } from './quota-init.service';
import { QuotaGuard } from '../common/guards/quota.guard';

@Global()
@Module({
  providers: [QuotaInitService, QuotaGuard],
  exports: [QuotaInitService, QuotaGuard],
})
export class QuotaModule {}
