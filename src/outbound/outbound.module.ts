import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OrderService } from './order.service';
import { AllocationService } from './allocation.service';
import { WaveService } from './wave.service';
import { PickingService } from './picking.service';
import { PackingService } from './packing.service';
import { ShippingService } from './shipping.service';
import { AllocationEngineProcessor } from './allocation-engine.processor';
import { WavePlannerProcessor } from './wave-planner.processor';
import { ShippingLabelsProcessor } from './shipping-labels.processor';
import { ReconcileAllocationsProcessor } from './reconcile-allocations.processor';
import { AllocationOverrideGuard } from './allocation-override.guard';
import { OutboundWebController } from './web/outbound.controller';
import { OutboundRfController } from './rf/outbound.controller';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'allocation-engine' },
      { name: 'wave-planner' },
      { name: 'shipping-labels' },
      { name: 'reconcile-allocations' },
    ),
  ],
  controllers: [OutboundWebController, OutboundRfController],
  providers: [
    OrderService,
    AllocationService,
    WaveService,
    PickingService,
    PackingService,
    ShippingService,
    AllocationEngineProcessor,
    WavePlannerProcessor,
    ShippingLabelsProcessor,
    ReconcileAllocationsProcessor,
    AllocationOverrideGuard,
  ],
  exports: [
    OrderService,
    AllocationService,
    WaveService,
    PickingService,
    PackingService,
    ShippingService,
  ],
})
export class OutboundModule {}
