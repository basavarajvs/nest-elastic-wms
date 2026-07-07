import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UomService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const data: any = {
      tenant_id: tenantId,
      uom_code: dto.uom_code,
      uom_name: dto.uom_name,
    };
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    return this.prisma.units_of_measure.create({ data });
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
    const record = await this.findById(tenantId, uomId);
    await this.prisma.units_of_measure.deleteMany({
      where: { tenant_id: tenantId, uom_id: uomId },
    });
    return record;
  }

  async update(tenantId: string, uomId: bigint, dto: any) {
    const data: any = {};
    if (dto.uom_code !== undefined) data.uom_code = dto.uom_code;
    if (dto.uom_name !== undefined) data.uom_name = dto.uom_name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    await this.prisma.units_of_measure.updateMany({
      where: { tenant_id: tenantId, uom_id: uomId },
      data,
    });
    return this.findById(tenantId, uomId);
  }
}
