import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { CartonPackedEvent, ShipmentDispatchedEvent } from '../definitions/outbound.events';

@Injectable()
export class WorkflowListener {
  private readonly logger = new Logger(WorkflowListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('carton.packed')
  async handleCartonPacked(event: CartonPackedEvent) {
    if (!event.order_id) return;

    try {
      await this.prisma.sales_orders.updateMany({
        where: { tenant_id: event.tenant_id, order_id: event.order_id },
        data: { status: 'PACKED' },
      });
    } catch (error) {
      this.logger.error(`Failed to update order status for carton.packed: ${error.message}`, error.stack);
    }
  }

  @OnEvent('shipment.dispatched')
  async handleShipmentDispatched(event: ShipmentDispatchedEvent) {
    if (!event.order_id) return;

    try {
      await this.prisma.sales_orders.updateMany({
        where: { tenant_id: event.tenant_id, order_id: event.order_id },
        data: { status: 'SHIPPED', shipped_date: new Date() },
      });
    } catch (error) {
      this.logger.error(`Failed to update order status for shipment.dispatched: ${error.message}`, error.stack);
    }
  }
}
