import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { ReceivingCompletedEvent } from '../definitions/inbound.events';
import { PickTaskCompletedEvent } from '../definitions/outbound.events';
import { CartonPackedEvent } from '../definitions/outbound.events';

@Injectable()
export class BillingListener {
  private readonly logger = new Logger(BillingListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('receiving.completed')
  async handleReceivingCompleted(event: ReceivingCompletedEvent) {
    try {
      const clientId = await this.resolveClientIdForReceipt(event);
      if (!clientId) {
        this.logger.warn(`Cannot bill receiving.completed: no client for receipt ${event.receipt_id}`);
        return;
      }

      await this.prisma.fulfillment_billing_events.create({
        data: {
          tenant_id: event.tenant_id,
          facility_id: event.facility_id!,
          event_type: 'RECEIVING',
          event_category: 'INBOUND',
          source_entity_type: 'GOODS_RECEIPT',
          source_entity_id: event.receipt_id,
          source_entity_reference: event.receipt_number,
          client_id: clientId,
          charge_amount: 25.0,
          charge_quantity: 1,
          charge_rate: 25.0,
          currency_code: 'USD',
          charge_description: `Receiving completed for ${event.receipt_number}`,
          event_date: new Date(),
          billing_status: 'UNBILLED',
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create billing event for receiving.completed: ${error.message}`, error.stack);
    }
  }

  @OnEvent('pick_task.completed')
  async handlePickTaskCompleted(event: PickTaskCompletedEvent) {
    try {
      let clientId: bigint | null = null;
      if (event.order_id) {
        const order = await this.prisma.sales_orders.findFirst({
          where: { tenant_id: event.tenant_id, order_id: event.order_id },
          select: { client_id: true },
        });
        if (order) clientId = order.client_id;
      }
      if (!clientId) {
        this.logger.warn(`Cannot bill pick_task.completed: no client for task ${event.task_id}`);
        return;
      }

      await this.prisma.fulfillment_billing_events.create({
        data: {
          tenant_id: event.tenant_id,
          facility_id: event.facility_id!,
          event_type: 'PICKING',
          event_category: 'OUTBOUND',
          source_entity_type: 'PICKING_TASK',
          source_entity_id: event.task_id,
          source_entity_reference: event.task_number,
          client_id: clientId,
          charge_amount: Number(0.75 * event.quantity_picked),
          charge_quantity: event.quantity_picked,
          charge_rate: 0.75,
          currency_code: 'USD',
          charge_description: `Picking ${event.quantity_picked} units for task ${event.task_number}`,
          event_date: new Date(),
          billing_status: 'UNBILLED',
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create billing event for pick_task.completed: ${error.message}`, error.stack);
    }
  }

  @OnEvent('carton.packed')
  async handleCartonPacked(event: CartonPackedEvent) {
    try {
      let clientId: bigint | null = null;
      if (event.order_id) {
        const order = await this.prisma.sales_orders.findFirst({
          where: { tenant_id: event.tenant_id, order_id: event.order_id },
          select: { client_id: true },
        });
        if (order) clientId = order.client_id;
      }
      if (!clientId) {
        this.logger.warn(`Cannot bill carton.packed: no client for session ${event.session_id}`);
        return;
      }

      await this.prisma.fulfillment_billing_events.create({
        data: {
          tenant_id: event.tenant_id,
          facility_id: event.facility_id!,
          event_type: 'PACKING',
          event_category: 'OUTBOUND',
          source_entity_type: 'CARTON',
          source_entity_id: event.carton_id,
          source_entity_reference: null,
          client_id: clientId,
          charge_amount: Number(2.5 * event.items_packed),
          charge_quantity: event.items_packed,
          charge_rate: 2.5,
          currency_code: 'USD',
          charge_description: `Packing ${event.items_packed} items in carton ${event.carton_id}`,
          event_date: new Date(),
          billing_status: 'UNBILLED',
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create billing event for carton.packed: ${error.message}`, error.stack);
    }
  }

  private async resolveClientIdForReceipt(event: ReceivingCompletedEvent): Promise<bigint | null> {
    if (event.asn_id) {
      const asn = await this.prisma.advance_ship_notices.findFirst({
        where: { tenant_id: event.tenant_id, asn_id: event.asn_id },
        select: { inbound_for_client_id: true },
      });
      if (asn?.inbound_for_client_id) return asn.inbound_for_client_id;
    }

    const receipt = await this.prisma.goods_receipts.findFirst({
      where: { tenant_id: event.tenant_id, receipt_id: event.receipt_id },
      select: { asn_number: true, vendor_id: true },
    });

    if (receipt?.asn_number) {
      const asn = await this.prisma.advance_ship_notices.findFirst({
        where: { tenant_id: event.tenant_id, asn_number: receipt.asn_number },
        select: { inbound_for_client_id: true },
      });
      if (asn?.inbound_for_client_id) return asn.inbound_for_client_id;
    }

    return null;
  }
}
