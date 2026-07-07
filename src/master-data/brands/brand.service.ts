import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BrandService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const data: any = {
      tenant_id: tenantId,
      brand_code: dto.brand_code,
      brand_name: dto.brand_name,
    };
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.logo_url !== undefined) data.logo_url = dto.logo_url;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    return this.prisma.product_brands.create({ data });
  }

  async findAll(tenantId: string) {
    return this.prisma.product_brands.findMany({
      where: { tenant_id: tenantId },
      orderBy: { brand_name: 'asc' },
    });
  }

  async findById(tenantId: string, brandId: bigint) {
    return this.prisma.product_brands.findFirst({ where: { tenant_id: tenantId, brand_id: brandId } });
  }

  async delete(tenantId: string, brandId: bigint) {
    const record = await this.findById(tenantId, brandId);
    await this.prisma.product_brands.deleteMany({
      where: { tenant_id: tenantId, brand_id: brandId },
    });
    return record;
  }

  async update(tenantId: string, brandId: bigint, dto: any) {
    const data: any = {};
    if (dto.brand_code !== undefined) data.brand_code = dto.brand_code;
    if (dto.brand_name !== undefined) data.brand_name = dto.brand_name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.logo_url !== undefined) data.logo_url = dto.logo_url;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    await this.prisma.product_brands.updateMany({
      where: { tenant_id: tenantId, brand_id: brandId },
      data,
    });
    return this.findById(tenantId, brandId);
  }
}
