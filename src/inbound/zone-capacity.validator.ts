import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ZoneCapacityValidator {
  private readonly logger = new Logger(ZoneCapacityValidator.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async validateLocation(locationId: string, tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
    const location = await (this.prisma as any).storageLocation.findFirst({
      where: { id: locationId, tenantId },
      include: { zone: true },
    });
    if (!location) return { allowed: false, reason: 'Location not found' };

    const attrs = location.attributes as any || {};
    const maxQty = attrs.maxQuantity || attrs.maxWeight;
    if (!maxQty) return { allowed: true };

    const currentUtilization = await (this.prisma as any).inventoryOnHand.aggregate({
      where: { locationId, tenantId },
      _sum: { quantityOnHand: true },
    });
    const currentQty = Number(currentUtilization._sum.quantityOnHand || 0);
    if (currentQty >= Number(maxQty)) {
      this.eventEmitter.emit('zone.capacity.exceeded', {
        locationId,
        zoneId: location.zoneId,
        tenantId,
        currentQty,
        maxQty: Number(maxQty),
      });
      return {
        allowed: false,
        reason: `Location at capacity (${currentQty}/${maxQty})`,
      };
    }
    return { allowed: true };
  }
}
