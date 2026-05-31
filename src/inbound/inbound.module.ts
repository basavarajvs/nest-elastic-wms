import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AsnService } from './asn.service';
import { GrnService } from './grn.service';
import { LpnService } from './lpn.service';
import { PutawayService } from './putaway.service';
import { QcService } from './qc.service';
import { PutawayGeneratorProcessor } from './putaway-generator.processor';
import { PutawayReconciliationJob } from './putaway-reconciliation.job';
import { ZoneCapacityValidator } from './zone-capacity.validator';
import { InboundWebController } from './web/inbound.controller';
import { InboundRfController } from './rf/inbound.controller';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'putaway-generator' },
    ),
    InventoryModule,
  ],
  controllers: [InboundWebController, InboundRfController],
  providers: [
    AsnService,
    GrnService,
    LpnService,
    PutawayService,
    QcService,
    PutawayGeneratorProcessor,
    PutawayReconciliationJob,
    ZoneCapacityValidator,
  ],
  exports: [
    AsnService,
    GrnService,
    LpnService,
    PutawayService,
    QcService,
  ],
})
export class InboundModule {}
