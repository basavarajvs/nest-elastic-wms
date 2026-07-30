import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { PutawayCompletedEvent } from '../definitions/inbound.events';
import { InventoryMovedEvent } from '../definitions/inventory.events';

@Injectable()
export class InventoryListener {
  private readonly logger = new Logger(InventoryListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('putaway.completed')
  async handlePutawayCompleted(event: PutawayCompletedEvent) {
    try {
      const existing = await this.prisma.inventory_on_hand.findFirst({
        where: {
          tenant_id: event.tenant_id,
          facility_id: event.facility_id,
          product_id: event.product_id,
          location_id: event.location_id,
        },
      });

      if (existing) {
        await this.prisma.inventory_on_hand.update({
          where: { on_hand_id: existing.on_hand_id },
          data: {
            quantity_on_hand: { increment: event.quantity },
          },
        });
      } else {
        this.logger.warn(
          `No inventory_on_hand record found for putaway product=${event.product_id} location=${event.location_id}; skipping creation`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to update inventory_on_hand for putaway: ${error.message}`, error.stack);
    }
  }

  @OnEvent('inventory.moved')
  async handleInventoryMoved(event: InventoryMovedEvent) {
    try {
      await this.prisma.inventory_on_hand.updateMany({
        where: {
          tenant_id: event.tenant_id,
          facility_id: event.facility_id,
          product_id: event.product_id,
          location_id: event.from_location_id,
        },
        data: {
          quantity_on_hand: { decrement: event.quantity },
        },
      });

      const destExisting = await this.prisma.inventory_on_hand.findFirst({
        where: {
          tenant_id: event.tenant_id,
          facility_id: event.facility_id,
          product_id: event.product_id,
          location_id: event.to_location_id,
        },
      });

      if (destExisting) {
        await this.prisma.inventory_on_hand.update({
          where: { on_hand_id: destExisting.on_hand_id },
          data: {
            quantity_on_hand: { increment: event.quantity },
          },
        });
      } else {
        this.logger.warn(
          `No inventory_on_hand record at destination product=${event.product_id} location=${event.to_location_id}; skipping increment`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to update inventory_on_hand for move: ${error.message}`, error.stack);
    }
  }
}
