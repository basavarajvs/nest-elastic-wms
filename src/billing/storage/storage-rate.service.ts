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
        client_id: dto.client_id ? BigInt(dto.client_id) : null,
        location_zone_type: dto.location_zone_type || null,
        unit_type: dto.unit_type,
        rate_per_unit: dto.rate_per_unit,
        rate_currency: dto.rate_currency || 'USD',
        rate_calculation_method: dto.rate_calculation_method || 'PER_PALLET_PER_DAY',
        minimum_charge_days: dto.minimum_charge_days ?? 0,
        free_storage_days: dto.free_storage_days ?? 0,
        effective_from: dto.effective_from ? new Date(dto.effective_from) : new Date(),
        effective_to: dto.effective_to ? new Date(dto.effective_to) : null,
      },
    });
  }

  async findAllRateMasters(tenantId: string, query: any) {
    let sql = `SELECT srm.*, c.client_name FROM multitenant.storage_rate_master srm LEFT JOIN multitenant.clients c ON srm.client_id = c.client_id WHERE srm.tenant_id = $1`;
    const params: any[] = [tenantId];
    let idx = 2;
    if (query.clientId) {
      sql += ` AND srm.client_id = $${idx++}`;
      params.push(BigInt(query.clientId));
    }
    if (query.unitType) {
      sql += ` AND srm.unit_type = $${idx++}`;
      params.push(query.unitType);
    }
    sql += ` ORDER BY srm.effective_from DESC`;
    return this.prisma.$queryRawUnsafe<any[]>(sql, ...params);
  }

  async findRateMasterById(tenantId: string, rateId: bigint) {
    const sql = `SELECT srm.*, c.client_name FROM multitenant.storage_rate_master srm LEFT JOIN multitenant.clients c ON srm.client_id = c.client_id WHERE srm.tenant_id = $1 AND srm.rate_id = $2`;
    const rows = await this.prisma.$queryRawUnsafe<any[]>(sql, tenantId, rateId);
    if (!rows.length) throw new NotFoundException('Rate master not found');
    return rows[0];
  }

  async updateRateMaster(tenantId: string, rateId: bigint, dto: any) {
    const data: any = {};
    if (dto.client_id !== undefined) data.client_id = dto.client_id ? BigInt(dto.client_id) : null;
    if (dto.location_zone_type !== undefined) data.location_zone_type = dto.location_zone_type;
    if (dto.unit_type !== undefined) data.unit_type = dto.unit_type;
    if (dto.rate_per_unit !== undefined) data.rate_per_unit = dto.rate_per_unit;
    if (dto.rate_currency !== undefined) data.rate_currency = dto.rate_currency;
    if (dto.rate_calculation_method !== undefined) data.rate_calculation_method = dto.rate_calculation_method;
    if (dto.minimum_charge_days !== undefined) data.minimum_charge_days = dto.minimum_charge_days;
    if (dto.free_storage_days !== undefined) data.free_storage_days = dto.free_storage_days;
    if (dto.effective_from !== undefined) data.effective_from = new Date(dto.effective_from);
    if (dto.effective_to !== undefined) data.effective_to = dto.effective_to ? new Date(dto.effective_to) : null;

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
