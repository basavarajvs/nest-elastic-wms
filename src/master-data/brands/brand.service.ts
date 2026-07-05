import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BrandService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.product_brands.create({
      data: {
        tenant_id: tenantId,
        brand_code: dto.brandCode,
        brand_name: dto.brandName,
        is_active: dto.isActive ?? true,
      },
    });
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
    return this.prisma.product_brands.deleteMany({
      where: { tenant_id: tenantId, brand_id: brandId },
    });
  }

  async update(tenantId: string, brandId: bigint, dto: any) {
    return this.prisma.product_brands.updateMany({
      where: { tenant_id: tenantId, brand_id: brandId },
      data: { brand_code: dto.brandCode, brand_name: dto.brandName, is_active: dto.isActive },
    });
  }
}
