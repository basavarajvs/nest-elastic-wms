import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageRateService } from './storage/storage-rate.service';
import { ClientRateService } from './storage/client-rate.service';
import { SnapshotService } from './storage/snapshot.service';
import { ChargeService } from './storage/charge.service';
import { InvoiceService } from './invoicing/invoice.service';
import { BillingWebController } from './web/billing.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BillingWebController],
  providers: [
    StorageRateService,
    ClientRateService,
    SnapshotService,
    ChargeService,
    InvoiceService,
  ],
  exports: [
    StorageRateService,
    ClientRateService,
    SnapshotService,
    ChargeService,
    InvoiceService,
  ],
})
export class BillingModule {}
