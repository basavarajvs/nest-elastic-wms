import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FulfillmentWorkflowService } from '../../fulfillment/fulfillment-workflow.service';
import { PickTaskCompletedEvent } from '../definitions/outbound.events';
import { CartonPackedEvent } from '../definitions/outbound.events';
import { ShipmentDispatchedEvent } from '../definitions/outbound.events';

@Injectable()
export class FulfillmentListener {
  private readonly logger = new Logger(FulfillmentListener.name);

  constructor(
    private readonly fulfillmentWorkflow: FulfillmentWorkflowService,
  ) {}

  @OnEvent('pick_task.completed')
  async handlePickTaskCompleted(event: PickTaskCompletedEvent) {
    if (!event.order_id) return;

    try {
      await this.fulfillmentWorkflow.recordPickEvent(
        event.tenant_id,
        event.order_id,
        event.completed_by,
      );
    } catch (error) {
      this.logger.error(`Failed to record pick event: ${error.message}`, error.stack);
    }
  }

  @OnEvent('carton.packed')
  async handleCartonPacked(event: CartonPackedEvent) {
    if (!event.order_id) return;

    try {
      await this.fulfillmentWorkflow.recordPackEvent(
        event.tenant_id,
        event.order_id,
        event.packed_by,
      );
    } catch (error) {
      this.logger.error(`Failed to record pack event: ${error.message}`, error.stack);
    }
  }

  @OnEvent('shipment.dispatched')
  async handleShipmentDispatched(event: ShipmentDispatchedEvent) {
    if (!event.order_id) return;

    try {
      await this.fulfillmentWorkflow.recordShipEvent(
        event.tenant_id,
        event.order_id,
        event.shipped_by,
      );
    } catch (error) {
      this.logger.error(`Failed to record ship event: ${error.message}`, error.stack);
    }
  }
}
