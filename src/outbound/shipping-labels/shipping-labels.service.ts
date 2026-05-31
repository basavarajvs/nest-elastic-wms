import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GenerateLabelDto } from './dtos/shipping-label.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ShippingLabelsService {
  private readonly logger = new Logger(ShippingLabelsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async generate(dto: GenerateLabelDto, tenantId: string) {
    const shipment = await (this.prisma as any).outboundShipment.findFirst({
      where: { id: dto.shipmentId, tenantId },
    });
    if (!shipment) throw new BadRequestException('Shipment not found');

    const carrierCode = dto.carrierCode || shipment.carrierCode;
    const labelUrl = `https://labels.example.com/${carrierCode || 'GENERIC'}/${dto.shipmentId}`;

    const label = await (this.prisma as any).shippingLabel.create({
      data: {
        tenantId,
        facilityId: shipment.facilityId,
        shipmentId: dto.shipmentId,
        containerId: dto.containerId || null,
        labelType: dto.labelType,
        labelData: '',
        labelUrl,
        trackingNumber: shipment.trackingNumber || null,
        carrierCode: carrierCode || null,
        status: 'GENERATED',
      },
    });

    await (this.prisma as any).outboundShipment.update({
      where: { id: dto.shipmentId },
      data: { labelUrl, status: 'CARRIER_ASSIGNED' },
    });

    this.eventEmitter.emit('shipping.label.generated', { labelId: label.id, shipmentId: dto.shipmentId, tenantId });
    this.logger.log(`Label generated: ${label.id} for shipment ${dto.shipmentId}`);
    return label;
  }

  async findAll(tenantId: string, shipmentId?: string) {
    const where: Record<string, any> = { tenantId };
    if (shipmentId) where.shipmentId = shipmentId;
    return (this.prisma as any).shippingLabel.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string, tenantId: string) {
    const label = await (this.prisma as any).shippingLabel.findFirst({ where: { id, tenantId } });
    if (!label) throw new NotFoundException('Shipping label not found');
    return label;
  }

  async print(id: string, copies: number, tenantId: string) {
    const label = await (this.prisma as any).shippingLabel.findFirst({ where: { id, tenantId } });
    if (!label) throw new NotFoundException('Shipping label not found');

    return (this.prisma as any).shippingLabel.update({
      where: { id },
      data: {
        printedCount: { increment: copies },
        lastPrintedAt: new Date(),
        status: 'PRINTED',
      },
    });
  }

  async getPdfDownload(id: string, tenantId: string) {
    const label = await (this.prisma as any).shippingLabel.findFirst({ where: { id, tenantId } });
    if (!label) throw new NotFoundException('Shipping label not found');
    return {
      id: label.id,
      labelUrl: label.labelUrl,
      trackingNumber: label.trackingNumber,
      carrierCode: label.carrierCode,
      labelType: label.labelType,
      generatedAt: label.createdAt,
    };
  }

  async handleTrackingWebhook(payload: { trackingNumber: string; status: string; carrierCode?: string }, tenantId: string) {
    const label = await (this.prisma as any).shippingLabel.findFirst({
      where: { trackingNumber: payload.trackingNumber, tenantId },
    });
    if (!label) throw new NotFoundException('Label not found for tracking number');
    await (this.prisma as any).shippingLabel.update({
      where: { id: label.id },
      data: { status: payload.status === 'DELIVERED' ? 'SHIPPED' : label.status },
    });
    this.eventEmitter.emit('shipping.label.tracking_updated', {
      labelId: label.id,
      trackingNumber: payload.trackingNumber,
      status: payload.status,
      tenantId,
    });
    return { received: true };
  }

  async delete(id: string, tenantId: string) {
    const label = await (this.prisma as any).shippingLabel.findFirst({ where: { id, tenantId } });
    if (!label) throw new NotFoundException('Shipping label not found');
    await (this.prisma as any).shippingLabel.delete({ where: { id } });
  }
}
