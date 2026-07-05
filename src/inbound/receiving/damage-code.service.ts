import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DamageCodeService {
  private readonly logger = new Logger(DamageCodeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.damage_codes.create({
      data: {
        tenant_id: tenantId,
        code: dto.code,
        description: dto.description,
        category: dto.category || 'TRANSPORT',
        requires_qc: dto.requiresQc ?? false,
        is_active: dto.isActive ?? true,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.is_active !== undefined) where.is_active = query.is_active === 'true';
    if (query.category) where.category = query.category;
    return this.prisma.damage_codes.findMany({ where, orderBy: { code: 'asc' } });
  }

  async findById(tenantId: string, damageCodeId: bigint) {
    const code = await this.prisma.damage_codes.findFirst({
      where: { tenant_id: tenantId, damage_code_id: damageCodeId },
    });
    if (!code) throw new NotFoundException('Damage code not found');
    return code;
  }

  async update(tenantId: string, damageCodeId: bigint, dto: any) {
    return this.prisma.damage_codes.updateMany({
      where: { tenant_id: tenantId, damage_code_id: damageCodeId },
      data: {
        code: dto.code,
        description: dto.description,
        category: dto.category,
        requires_qc: dto.requiresQc,
        is_active: dto.isActive,
      },
    });
  }

  async delete(tenantId: string, damageCodeId: bigint) {
    return this.prisma.damage_codes.deleteMany({
      where: { tenant_id: tenantId, damage_code_id: damageCodeId },
    });
  }

  async seedDefaults(tenantId: string) {
    const defaults = [
      { code: 'CRUSHED_PALLET', description: 'Crushed Pallet', category: 'TRANSPORT', requires_qc: false },
      { code: 'WATER_DAMAGE', description: 'Water Damage', category: 'PRODUCT', requires_qc: true },
      { code: 'BROKEN_PACKAGING', description: 'Broken Packaging', category: 'PACKAGING', requires_qc: false },
      { code: 'LEAKING_PRODUCT', description: 'Leaking Product', category: 'PRODUCT', requires_qc: true },
      { code: 'CRUSHED_CARTON', description: 'Crushed Carton', category: 'TRANSPORT', requires_qc: false },
      { code: 'MISSING_PRODUCT', description: 'Missing Product', category: 'QUANTITY', requires_qc: false },
      { code: 'LABEL_DAMAGE', description: 'Label Damaged / Missing', category: 'PACKAGING', requires_qc: false },
    ];
    let seeded = 0;
    for (const d of defaults) {
      const existing = await this.prisma.damage_codes.findFirst({
        where: { tenant_id: tenantId, code: d.code },
      });
      if (!existing) {
        await this.prisma.damage_codes.create({
          data: { ...d, tenant_id: tenantId, is_active: true },
        });
        seeded++;
      }
    }
    return { seeded };
  }
}
