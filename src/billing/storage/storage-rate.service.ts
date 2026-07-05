import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class StorageRateService {
  private readonly logger = new Logger(StorageRateService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── RATE MASTER ─────────────────────────────────────────────────────────

  async createRateMaster(tenantId: string, dto: any) {
    return this.prisma.storage_rate_master.create({
      data: {
        tenant_id: tenantId,
        client_id: dto.clientId ? BigInt(dto.clientId) : null,
        location_zone_type: dto.locationZoneType || null,
        unit_type: dto.unitType,
        rate_per_unit: dto.ratePerUnit,
        rate_currency: dto.rateCurrency || 'USD',
        rate_calculation_method: dto.rateCalculationMethod || 'PER_PALLET_PER_DAY',
        minimum_charge_days: dto.minimumChargeDays ?? 0,
        free_storage_days: dto.freeStorageDays ?? 0,
        effective_from: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
        effective_to: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      },
    });
  }

  async findAllRateMasters(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.clientId) where.client_id = BigInt(query.clientId);
    if (query.unitType) where.unit_type = query.unitType;
    return this.prisma.storage_rate_master.findMany({
      where,
      orderBy: { effective_from: 'desc' },
    });
  }

  async findRateMasterById(tenantId: string, rateId: bigint) {
    const rate = await this.prisma.storage_rate_master.findFirst({
      where: { tenant_id: tenantId, rate_id: rateId },
    });
    if (!rate) throw new NotFoundException('Rate master not found');
    return rate;
  }

  async updateRateMaster(tenantId: string, rateId: bigint, dto: any) {
    const data: any = {};
    if (dto.clientId !== undefined) data.client_id = dto.clientId ? BigInt(dto.clientId) : null;
    if (dto.locationZoneType !== undefined) data.location_zone_type = dto.locationZoneType;
    if (dto.unitType !== undefined) data.unit_type = dto.unitType;
    if (dto.ratePerUnit !== undefined) data.rate_per_unit = dto.ratePerUnit;
    if (dto.rateCurrency !== undefined) data.rate_currency = dto.rateCurrency;
    if (dto.rateCalculationMethod !== undefined) data.rate_calculation_method = dto.rateCalculationMethod;
    if (dto.minimumChargeDays !== undefined) data.minimum_charge_days = dto.minimumChargeDays;
    if (dto.freeStorageDays !== undefined) data.free_storage_days = dto.freeStorageDays;
    if (dto.effectiveFrom !== undefined) data.effective_from = new Date(dto.effectiveFrom);
    if (dto.effectiveTo !== undefined) data.effective_to = dto.effectiveTo ? new Date(dto.effectiveTo) : null;

    const rate = await this.prisma.storage_rate_master.updateMany({
      where: { tenant_id: tenantId, rate_id: rateId },
      data,
    });
    if (!rate.count) throw new NotFoundException('Rate master not found');
    return this.findRateMasterById(tenantId, rateId);
  }

  async findApplicableRate(tenantId: string, clientId: bigint, unitType: string, zoneType?: string) {
    const rates = await this.prisma.storage_rate_master.findMany({
      where: {
        tenant_id: tenantId,
        unit_type: unitType,
        location_zone_type: zoneType || null,
        effective_from: { lte: new Date() },
        OR: [
          { effective_to: null },
          { effective_to: { gte: new Date() } },
        ],
      },
      orderBy: { effective_from: 'desc' },
    });
    if (rates.length === 0) return null;
    const clientRates = rates.filter((r) => r.client_id === clientId);
    if (clientRates.length > 0) return clientRates[0];
    const defaultRates = rates.filter((r) => !r.client_id);
    return defaultRates.length > 0 ? defaultRates[0] : rates[0];
  }

  async getEffectiveRate(tenantId: string, clientId: bigint, productId: bigint, locationZoneType?: string) {
    const rate = await this.findApplicableRate(tenantId, clientId, 'PALLET', locationZoneType);
    if (!rate) {
      this.logger.warn(`No rate found for client ${clientId}, unit PALLET`);
      return null;
    }
    return rate;
  }

  async deleteRateMaster(tenantId: string, rateMasterId: bigint) {
    return this.prisma.storage_rate_master.deleteMany({
      where: { tenant_id: tenantId, rate_id: rateMasterId },
    });
  }
}
