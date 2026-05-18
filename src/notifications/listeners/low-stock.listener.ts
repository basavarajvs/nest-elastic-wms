import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WmsNotificationClientService } from '../wms-notification-client.service';
import { WmsNotificationType, COMPLIANCE_OVERRIDE_TYPES } from '../wms-notification.types';

@Injectable()
export class LowStockListener {
  private readonly logger = new Logger(LowStockListener.name);

  constructor(
    private readonly client: WmsNotificationClientService,
  ) {}

  @OnEvent('inventory.low_stock')
  async handle(payload: {
    productCode: string;
    productId: string;
    currentQty: number;
    availableQty: number;
    reorderPoint: number;
    locationCode: string;
    tenantId: string;
  }) {
    try {
      if (payload.availableQty > 0) {
        await this.client.dispatch({
          type: WmsNotificationType.LOW_STOCK_ALERT,
          tenantId: payload.tenantId,
          recipients: [],
          variables: {
            productCode: payload.productCode,
            currentQty: payload.availableQty,
            reorderPoint: payload.reorderPoint,
            locationCode: payload.locationCode,
          },
          priority: 'normal',
        });
        this.logger.debug(
          `Low stock alert for ${payload.productCode} (qty: ${payload.availableQty})`,
        );
      }

      if (payload.availableQty === 0) {
        const isComplianceType = COMPLIANCE_OVERRIDE_TYPES.has(
          WmsNotificationType.STOCKOUT_CRITICAL,
        );
        await this.client.dispatch({
          type: WmsNotificationType.STOCKOUT_CRITICAL,
          tenantId: payload.tenantId,
          recipients: [],
          variables: {
            productCode: payload.productCode,
            currentQty: 0,
            locationCode: payload.locationCode,
          },
          priority: 'immediate',
          bypassPreferences: isComplianceType,
        });
        this.logger.warn(
          `Stockout critical for ${payload.productCode}`,
        );
      }
    } catch (err: any) {
      this.logger.error(
        `Low stock listener failed: ${err.message}`,
      );
    }
  }
}
