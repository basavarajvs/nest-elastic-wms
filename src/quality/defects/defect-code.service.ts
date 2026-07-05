import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DefectCodeService {
  private readonly logger = new Logger(DefectCodeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.defect_codes.create({
      data: {
        tenant_id: tenantId,
        code: dto.code,
        description: dto.description,
        category: dto.category || 'PACKAGING',
        severity: dto.severity || 'MINOR',
        is_active: dto.isActive ?? true,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.is_active !== undefined) where.is_active = query.is_active === 'true';
    if (query.category) where.category = query.category;
    if (query.severity) where.severity = query.severity;
    return this.prisma.defect_codes.findMany({ where, orderBy: { code: 'asc' } });
  }

  async findById(tenantId: string, defectCodeId: bigint) {
    const code = await this.prisma.defect_codes.findFirst({
      where: { tenant_id: tenantId, defect_code_id: defectCodeId },
    });
    if (!code) throw new NotFoundException('Defect code not found');
    return code;
  }

  async update(tenantId: string, defectCodeId: bigint, dto: any) {
    return this.prisma.defect_codes.updateMany({
      where: { tenant_id: tenantId, defect_code_id: defectCodeId },
      data: {
        code: dto.code,
        description: dto.description,
        category: dto.category,
        severity: dto.severity,
        is_active: dto.isActive,
      },
    });
  }

  async delete(tenantId: string, defectCodeId: bigint) {
    return this.prisma.defect_codes.deleteMany({
      where: { tenant_id: tenantId, defect_code_id: defectCodeId },
    });
  }

  async seedDefaults(tenantId: string) {
    const defaults = [
      { code: 'BROKEN_SEAL', description: 'Broken Seal', category: 'PACKAGING', severity: 'MAJOR' },
      { code: 'CRUSHED_PACKAGING', description: 'Crushed Packaging', category: 'PACKAGING', severity: 'MAJOR' },
      { code: 'LABEL_DAMAGED', description: 'Label Damaged', category: 'LABEL', severity: 'MINOR' },
      { code: 'QUANTITY_MISMATCH', description: 'Quantity Mismatch', category: 'QUANTITY', severity: 'MAJOR' },
      { code: 'EXPIRY_EXCEEDED', description: 'Expiry Date Exceeded', category: 'EXPIRY', severity: 'CRITICAL' },
      { code: 'LOT_MISMATCH', description: 'Lot Number Mismatch', category: 'LOT_MISMATCH', severity: 'CRITICAL' },
      { code: 'PRODUCT_DAMAGE', description: 'Product Physical Damage', category: 'PRODUCT_DAMAGE', severity: 'CRITICAL' },
      { code: 'TEMPERATURE_BREACH', description: 'Temperature Breach', category: 'TEMPERATURE', severity: 'CRITICAL' },
      { code: 'COLOR_MISMATCH', description: 'Color Mismatch', category: 'COLOR', severity: 'MINOR' },
      { code: 'SIZE_MISMATCH', description: 'Size Mismatch', category: 'SIZE', severity: 'MINOR' },
    ];
    let seeded = 0;
    for (const d of defaults) {
      const existing = await this.prisma.defect_codes.findFirst({
        where: { tenant_id: tenantId, code: d.code },
      });
      if (!existing) {
        await this.prisma.defect_codes.create({
          data: { ...d, tenant_id: tenantId, is_active: true },
        });
        seeded++;
      }
    }
    return { seeded };
  }
}
