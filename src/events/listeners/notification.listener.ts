import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderShippedEvent } from '../definitions/outbound.events';
import { InspectionFailedEvent } from '../definitions/quality.events';
import { QualityHoldCreatedEvent } from '../definitions/quality.events';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  @OnEvent('order.shipped')
  async handleOrderShipped(event: OrderShippedEvent) {
    this.logger.log(`[FUTURE] Send shipment notification for order ${event.order_number}`);
  }

  @OnEvent('inspection.failed')
  async handleInspectionFailed(event: InspectionFailedEvent) {
    this.logger.log(`[FUTURE] Send inspection failure alert for inspection ${event.inspection_id}`);
  }

  @OnEvent('hold.created')
  async handleHoldCreated(event: QualityHoldCreatedEvent) {
    this.logger.log(`[FUTURE] Send hold notification for hold ${event.hold_id}`);
  }
}
