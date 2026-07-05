import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UomService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.units_of_measure.create({
      data: {
        tenant_id: tenantId,
        uom_code: dto.uomCode,
        uom_name: dto.uomName,
        is_active: dto.isActive ?? true,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.units_of_measure.findMany({
      where: { tenant_id: tenantId },
      orderBy: { uom_code: 'asc' },
    });
  }

  async findById(tenantId: string, uomId: bigint) {
    return this.prisma.units_of_measure.findFirst({ where: { tenant_id: tenantId, uom_id: uomId } });
  }

  async delete(tenantId: string, uomId: bigint) {
    return this.prisma.units_of_measure.deleteMany({
      where: { tenant_id: tenantId, uom_id: uomId },
    });
  }

  async update(tenantId: string, uomId: bigint, dto: any) {
    return this.prisma.units_of_measure.updateMany({
      where: { tenant_id: tenantId, uom_id: uomId },
      data: { uom_code: dto.uomCode, uom_name: dto.uomName, is_active: dto.isActive },
    });
  }
}
