import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventorySeederService {
  private readonly logger = new Logger(InventorySeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  async seedPolicies(tenantId: string, facilityId: string): Promise<void> {
    const products = await (this.prisma as any).product.findMany({
      where: { tenantId },
      take: 20,
    });
    for (const product of products) {
      await (this.prisma as any).inventoryPolicy.upsert({
        where: {
          inventory_policies_uq: {
            tenantId,
            facilityId,
            productId: product.id,
            locationId: '',
          },
        },
        update: {},
        create: {
          tenantId,
          facilityId,
          productId: product.id,
          locationId: '',
          reorderPoint: 10,
          maxStockLevel: 100,
          safetyStock: 5,
        },
      });
    }
    this.logger.log(`Seeded ${products.length} inventory policies`);
  }
}
