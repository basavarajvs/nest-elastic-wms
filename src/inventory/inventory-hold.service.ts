import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHoldDto, ReleaseHoldDto } from './dtos/hold.dto';

@Injectable()
export class InventoryHoldService {
  private readonly logger = new Logger(InventoryHoldService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createHold(dto: CreateHoldDto, tenantId: string, userId: string): Promise<any> {
    return (this.prisma as any).inventoryHold.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        productId: dto.productId,
        locationId: dto.locationId,
        lotId: dto.lotId,
        holdType: dto.holdType,
        reason: dto.reason,
        placedByUserId: userId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async releaseHold(holdId: string, dto: ReleaseHoldDto, tenantId: string, userId: string): Promise<any> {
    return (this.prisma as any).$transaction(async (tx: any) => {
      const hold = await tx.inventoryHold.findFirst({
        where: { id: holdId, tenantId, status: 'ACTIVE' },
      });
      if (!hold) throw new Error('Active hold not found');

      if (dto.disposition === 'RESTORE' && hold.lotId) {
        const holdQty = hold.quantityOnHold ?? 1;
        await tx.inventoryOnHand.updateMany({
          where: { tenantId, lotId: hold.lotId },
          data: { quantityOnHold: { decrement: holdQty } },
        });
      }

      return tx.inventoryHold.update({
        where: { id: holdId },
        data: {
          status: 'RELEASED',
          releasedByUserId: userId,
          releasedAt: new Date(),
        },
      });
    });
  }

  async listHolds(tenantId: string, filters: {
    facilityId?: string;
    status?: string;
    lotId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    const where: any = { tenantId };
    if (filters.facilityId) where.facilityId = filters.facilityId;
    if (filters.status) where.status = filters.status;
    if (filters.lotId) where.lotId = filters.lotId;

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 200);
    const [data, total] = await Promise.all([
      (this.prisma as any).inventoryHold.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).inventoryHold.count({ where }),
    ]);
    return { data, total };
  }

  async checkHoldsForLot(tenantId: string, lotId: string): Promise<any[]> {
    return (this.prisma as any).inventoryHold.findMany({
      where: { tenantId, lotId, status: 'ACTIVE' },
    });
  }
}
