import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertPolicyDto } from './dtos/policy.dto';

@Injectable()
export class InventoryPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(dto: UpsertPolicyDto, tenantId: string): Promise<any> {
    const data = {
      tenantId,
      facilityId: dto.facilityId,
      productId: dto.productId,
      locationId: dto.locationId ?? '',
      reorderPoint: dto.reorderPoint,
      maxStockLevel: dto.maxStockLevel,
      safetyStock: dto.safetyStock ?? 0,
      isActive: dto.isActive ?? true,
    };

    if (dto.locationId) {
      return (this.prisma as any).inventoryPolicy.upsert({
        where: {
          inventory_policies_uq: {
            tenantId,
            facilityId: dto.facilityId,
            productId: dto.productId,
            locationId: dto.locationId,
          },
        },
        update: data,
        create: data,
      });
    }
    return (this.prisma as any).inventoryPolicy.create({ data });
  }

  async findByProduct(tenantId: string, productId: string, facilityId: string): Promise<any[]> {
    return (this.prisma as any).inventoryPolicy.findMany({
      where: { tenantId, productId, facilityId, isActive: true },
    });
  }
}
