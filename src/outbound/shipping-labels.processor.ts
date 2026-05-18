import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

const MAX_RETRIES = 3;

@Processor('shipping-labels')
export class ShippingLabelsProcessor extends WorkerHost {
  private readonly logger = new Logger(ShippingLabelsProcessor.name);
  private circuitOpen = false;
  private failureCount = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    const { shipmentId, tenantId, carrierCode } = job.data;
    this.logger.log(`Generating label for shipment ${shipmentId}`);

    if (this.circuitOpen) {
      this.logger.warn('Circuit breaker open — using GENERIC_ZPL fallback');
      await this.generateGenericLabel(shipmentId, tenantId);
      return { labelType: 'GENERIC_ZPL', circuitBreaker: true };
    }

    try {
      const labelUrl = await this.callCarrierApi(carrierCode || 'UPS', shipmentId);

      await (this.prisma as any).outboundShipment.update({
        where: { id: shipmentId },
        data: { labelUrl, status: 'CARRIER_ASSIGNED' },
      });

      this.failureCount = 0;
      return { labelUrl, status: 'CARRIER_ASSIGNED' };
    } catch (err: any) {
      this.failureCount++;
      this.logger.error(`Carrier API error (attempt ${this.failureCount}/${MAX_RETRIES}): ${err.message}`);

      if (this.failureCount >= MAX_RETRIES) {
        this.circuitOpen = true;
        setTimeout(() => { this.circuitOpen = false; this.failureCount = 0; }, 30000);

        await this.generateGenericLabel(shipmentId, tenantId);
        this.eventEmitter.emit('shipping.label.fallback', { shipmentId, tenantId });
        return { labelType: 'GENERIC_ZPL', circuitBreaker: true };
      }
      throw err;
    }
  }

  private async generateGenericLabel(shipmentId: string, tenantId: string): Promise<void> {
    await (this.prisma as any).outboundShipment.update({
      where: { id: shipmentId },
      data: { labelUrl: 'GENERIC_ZPL', metadata: { labelType: 'GENERIC_ZPL', generatedAt: new Date().toISOString() } },
    });
  }

  private async callCarrierApi(carrier: string, shipmentId: string): Promise<string> {
    await new Promise((r) => setTimeout(r, 100));
    return `https://labels.example.com/${carrier}/${shipmentId}`;
  }
}
