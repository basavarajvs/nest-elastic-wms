import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReceivingToleranceService {
  private readonly logger = new Logger(ReceivingToleranceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getToleranceConfig(tenantId: string, facilityId: bigint, productId?: bigint, vendorId?: bigint) {
    const queries: any[] = [];
    if (productId) {
      queries.push({ tenant_id: tenantId, facility_id: facilityId, product_id: productId, is_active: true });
    }
    if (vendorId) {
      queries.push({ tenant_id: tenantId, facility_id: facilityId, vendor_id: vendorId, product_id: null, is_active: true });
    }
    queries.push({ tenant_id: tenantId, facility_id: facilityId, product_id: null, vendor_id: null, is_active: true });

    for (const where of queries) {
      const config = await this.prisma.receiving_tolerance_configs.findFirst({ where });
      if (config) return config;
    }
    return null;
  }

  async isWithinTolerance(tenantId: string, facilityId: bigint, expectedQty: number, actualQty: number, productId?: bigint, vendorId?: bigint) {
    const config = await this.getToleranceConfig(tenantId, facilityId, productId, vendorId);
    const diff = Math.abs(actualQty - expectedQty);
    if (actualQty > expectedQty) {
      if (!config) return { within: true, variance: 'OVER' };
      const overPct = config.over_tolerance ? (diff / expectedQty) * 100 <= Number(config.over_tolerance) : true;
      return { within: overPct, variance: 'OVER', requiresSupervisor: !overPct && config.requires_supervisor_approval };
    }
    if (actualQty < expectedQty) {
      if (!config) return { within: true, variance: 'SHORT' };
      const underPct = config.under_tolerance ? (diff / expectedQty) * 100 <= Number(config.under_tolerance) : true;
      return { within: underPct, variance: 'SHORT', requiresSupervisor: !underPct && config.requires_supervisor_approval };
    }
    return { within: true, variance: 'NONE' };
  }

  async upsert(tenantId: string, dto: any) {
    const data: any = {
      tenant_id: tenantId,
      facility_id: BigInt(dto.facility_id),
      product_id: dto.product_id ? BigInt(dto.product_id) : undefined,
      vendor_id: dto.vendor_id ? BigInt(dto.vendor_id) : undefined,
      tolerance_type: dto.tolerance_type || 'PERCENTAGE',
      over_tolerance: dto.max_tolerance,
      under_tolerance: dto.min_tolerance,
      requires_supervisor_approval: dto.requires_supervisor_approval ?? true,
      is_active: dto.is_active ?? true,
    };
    const existing = await this.prisma.receiving_tolerance_configs.findFirst({
      where: {
        tenant_id: tenantId,
        facility_id: data.facility_id,
        product_id: data.product_id || null,
        vendor_id: data.vendor_id || null,
      },
    });
    if (existing) {
      await this.prisma.receiving_tolerance_configs.updateMany({
        where: { config_id: existing.config_id },
        data,
      });
      return existing;
    }
    return this.prisma.receiving_tolerance_configs.create({ data });
  }

  async findAll(tenantId: string, facilityId: bigint) {
    return this.prisma.receiving_tolerance_configs.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId },
    });
  }

  async delete(tenantId: string, configId: bigint) {
    const entity = await this.prisma.receiving_tolerance_configs.findFirst({
      where: { tenant_id: tenantId, config_id: configId },
    });
    if (!entity) throw new NotFoundException('Receiving tolerance config not found');
    await this.prisma.receiving_tolerance_configs.deleteMany({
      where: { tenant_id: tenantId, config_id: configId },
    });
    return entity;
  }
}
