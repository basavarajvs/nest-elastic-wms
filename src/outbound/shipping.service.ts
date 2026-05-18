import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ShipmentLoadDto } from './dtos/shipping.dto';

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async assignToLoad(dto: ShipmentLoadDto, tenantId: string): Promise<any> {
    const shipment = await (this.prisma as any).outboundShipment.findFirst({
      where: { id: dto.shipmentId, tenantId },
    });
    if (!shipment) throw new BadRequestException('Shipment not found');

    return (this.prisma as any).outboundShipment.update({
      where: { id: dto.shipmentId },
      data: {
        loadId: dto.loadId,
        dockDoorCode: dto.dockDoorCode,
        status: 'STAGED',
      },
    });
  }

  async confirmDispatch(loadId: string, tenantId: string): Promise<any> {
    const shipments = await (this.prisma as any).outboundShipment.findMany({
      where: { loadId, tenantId, status: { in: ['STAGED', 'LOADED'] } },
    });
    if (shipments.length === 0) throw new BadRequestException('No shipments found for this load');

    for (const shipment of shipments) {
      await (this.prisma as any).outboundShipment.update({
        where: { id: shipment.id },
        data: { status: 'SHIPPED', shippedAt: new Date() },
      });
    }

    this.eventEmitter.emit('shipment.dispatched', { loadId, shipments: shipments.length, tenantId });
    return { status: 'SHIPPED', shipmentsDispatched: shipments.length };
  }

  async generateManifest(shipmentId: string, tenantId: string): Promise<any> {
    const shipment = await (this.prisma as any).outboundShipment.findFirst({
      where: { id: shipmentId, tenantId },
    });
    if (!shipment) throw new BadRequestException('Shipment not found');
    return { shipmentNumber: shipment.shipmentNumber, labelUrl: shipment.labelUrl || 'PENDING' };
  }
}
