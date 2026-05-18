import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WmsNotificationClientService } from '../wms-notification-client.service';
import { WmsNotificationType } from '../wms-notification.types';

@Injectable()
export class OrderStatusListener {
  private readonly logger = new Logger(OrderStatusListener.name);

  constructor(
    private readonly client: WmsNotificationClientService,
  ) {}

  @OnEvent('order.status_changed')
  async handle(payload: {
    orderId: string;
    orderNumber: string;
    clientCode: string;
    status: string;
    itemsCount: number;
    totalValue: number;
    trackingNumber?: string;
    tenantId: string;
  }) {
    try {
      const variables = {
        orderNumber: payload.orderNumber,
        clientCode: payload.clientCode,
        status: payload.status,
        itemsCount: payload.itemsCount,
        totalValue: payload.totalValue,
        trackingNumber: payload.trackingNumber || '',
      };

      switch (payload.status) {
        case 'SHIPPED': {
          await this.client.dispatch({
            type: WmsNotificationType.ORDER_STATUS_CHANGED,
            tenantId: payload.tenantId,
            recipients: [{ roleCode: 'CLIENT' }, { roleCode: 'WAREHOUSE_ADMIN' }],
            variables,
            priority: 'normal',
          });
          break;
        }
        case 'BACKORDERED': {
          await this.client.dispatch({
            type: WmsNotificationType.ORDER_STATUS_CHANGED,
            tenantId: payload.tenantId,
            recipients: [{ roleCode: 'SALES_REP' }, { roleCode: 'INVENTORY_CLERK' }],
            variables,
            priority: 'high',
          });
          break;
        }
        case 'VALIDATED': {
          await this.client.dispatch({
            type: WmsNotificationType.ORDER_STATUS_CHANGED,
            tenantId: payload.tenantId,
            recipients: [{ roleCode: 'PLANNING_MANAGER' }],
            variables,
            priority: 'normal',
          });
          break;
        }
      }
    } catch (err: any) {
      this.logger.error(
        `Order status listener failed for ${payload.orderNumber}: ${err.message}`,
      );
    }
  }
}
