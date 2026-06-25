import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SnapshotService {
  private readonly logger = new Logger(SnapshotService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateSnapshot(dto: { facilityId: string; snapshotDate: string; clientId: string }, tenantId: string): Promise<any> {
    const snapshotDate = new Date(dto.snapshotDate);

    const inventoryItems = await this.prisma.inventoryOnHand.findMany({
      where: { tenantId, facilityId: dto.facilityId, quantityOnHand: { gt: 0 } },
      select: {
        productId: true,
        locationId: true,
        quantityOnHand: true,
      },
    });

    if (inventoryItems.length === 0) {
      this.logger.warn(`No inventory items found for snapshot at facility ${dto.facilityId}`);
      return { created: 0, items: [] };
    }

    const rates = await this.prisma.storageRateMaster.findMany({
      where: { tenantId, facilityId: dto.facilityId, isActive: true },
      include: {
        clientRates: {
          where: { clientId: dto.clientId, isActive: true },
          orderBy: { effectiveDate: 'desc' },
          take: 1,
        },
      },
    });

    const rateApplied = this.lookupRate(rates, dto.clientId);

    const snapshots: any[] = [];
    for (const item of inventoryItems) {
      const existing = await this.prisma.storageInventorySnapshot.findFirst({
        where: {
          tenantId,
          facilityId: dto.facilityId,
          snapshotDate,
          clientId: dto.clientId,
          productId: item.productId,
          locationId: item.locationId,
        },
      });
      if (existing) continue;

      const snapshot = await this.prisma.storageInventorySnapshot.create({
        data: {
          tenantId,
          facilityId: dto.facilityId,
          snapshotDate,
          clientId: dto.clientId,
          productId: item.productId,
          locationId: item.locationId,
          quantity: item.quantityOnHand,
          daysStored: 1,
          rateAppliedId: rateApplied?.id ?? null,
          chargeAmount: rateApplied ? this.calculate(rateApplied, item.quantityOnHand) : undefined,
        },
      });
      snapshots.push(snapshot);
    }

    return { created: snapshots.length, items: snapshots };
  }

  private lookupRate(rates: any[], clientId: string): { id: string; rate: number; rateType: string } | null {
    for (const rate of rates) {
      const cr = rate.clientRates?.[0];
      if (cr) {
        return { id: rate.id, rate: Number(cr.negotiatedRate), rateType: rate.rateType };
      }
      if (rate.defaultRate) {
        return { id: rate.id, rate: Number(rate.defaultRate), rateType: rate.rateType };
      }
    }
    return null;
  }

  private calculate(rate: { rate: number; rateType: string }, quantity: number): number {
    return rate.rate * quantity;
  }

  async listSnapshots(tenantId: string, filters: { facilityId: string; snapshotDate?: string; clientId?: string }): Promise<any> {
    const where: any = { tenantId, facilityId: filters.facilityId };
    if (filters.snapshotDate) where.snapshotDate = new Date(filters.snapshotDate);
    if (filters.clientId) where.clientId = filters.clientId;
    return this.prisma.storageInventorySnapshot.findMany({
      where,
      orderBy: [{ clientId: 'asc' }, { productId: 'asc' }],
    });
  }

  async calculateCharges(tenantId: string, dto: { facilityId: string; periodStart: string; periodEnd: string; clientId?: string; cycleId?: string }): Promise<any> {
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);
    const where: any = {
      tenantId,
      facilityId: dto.facilityId,
      snapshotDate: { gte: periodStart, lte: periodEnd },
    };
    if (dto.clientId) where.clientId = dto.clientId;

    const snapshots = await this.prisma.storageInventorySnapshot.findMany({ where });

    const grouped = new Map<string, any[]>();
    for (const snap of snapshots) {
      const key = `${snap.clientId}_${snap.productId}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(snap);
    }

    const charges: any[] = [];
    let idx = 0;
    for (const [, items] of grouped) {
      const first = items[0];
      const totalCharge = items.reduce((sum, i) => sum + Number(i.chargeAmount || 0), 0);
      idx++;
      const chargeNumber = `CHG-${Date.now()}-${idx}`;

      const charge = await this.prisma.storageCharge.create({
        data: {
          tenantId,
          facilityId: dto.facilityId,
          chargeNumber,
          clientId: first.clientId,
          chargeType: 'STORAGE',
          cycleId: dto.cycleId ?? undefined,
          periodStart,
          periodEnd,
          quantity: items.reduce((s, i) => s + i.quantity, 0),
          rateApplied: first.chargeAmount ? (totalCharge / items.length) : 0,
          amount: totalCharge,
          description: `Storage charge for period ${dto.periodStart} to ${dto.periodEnd}`,
        },
      });
      charges.push(charge);
    }

    return { created: charges.length, items: charges };
  }

  async listCharges(tenantId: string, filters: { facilityId: string; clientId?: string; status?: string }): Promise<any> {
    const where: any = { tenantId, facilityId: filters.facilityId };
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.status) where.status = filters.status;
    return this.prisma.storageCharge.findMany({ where, orderBy: { createdAt: 'desc' } });
  }
}
