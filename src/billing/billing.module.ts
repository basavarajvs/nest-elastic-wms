import { Module } from '@nestjs/common';
import { StorageRateService } from './storage-rate.service';
import { BillingCycleService } from './billing-cycle.service';
import { SnapshotService } from './snapshot.service';
import { InvoiceService } from './invoice.service';
import { BillingWebController } from './web/billing.controller';

@Module({
  controllers: [BillingWebController],
  providers: [StorageRateService, BillingCycleService, SnapshotService, InvoiceService],
  exports: [StorageRateService, SnapshotService, InvoiceService],
})
export class BillingModule {}
