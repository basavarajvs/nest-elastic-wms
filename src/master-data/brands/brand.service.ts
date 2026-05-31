import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBrandDto, UpdateBrandDto } from './dtos/create-brand.dto';

@Injectable()
export class BrandService {
  private readonly logger = new Logger(BrandService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBrandDto, tenantId: string) {
    const existing = await (this.prisma as any).productBrand.findFirst({
      where: { tenantId, brandCode: dto.brandCode },
    });
    if (existing) throw new BadRequestException(`Brand ${dto.brandCode} already exists`);

    return (this.prisma as any).productBrand.create({
      data: { tenantId, brandCode: dto.brandCode, name: dto.name, isActive: dto.isActive ?? true },
    });
  }

  async findAll(tenantId: string) {
    return (this.prisma as any).productBrand.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  async findById(id: string, tenantId: string) {
    const b = await (this.prisma as any).productBrand.findFirst({ where: { id, tenantId } });
    if (!b) throw new NotFoundException('Brand not found');
    return b;
  }

  async update(id: string, tenantId: string, dto: UpdateBrandDto) {
    const b = await (this.prisma as any).productBrand.findFirst({ where: { id, tenantId } });
    if (!b) throw new NotFoundException('Brand not found');
    return (this.prisma as any).productBrand.update({ where: { id }, data: dto });
  }

  async delete(id: string, tenantId: string) {
    const productsCount = await (this.prisma as any).product.count({ where: { brandId: id } });
    if (productsCount > 0) {
      throw new BadRequestException(`Cannot delete brand with ${productsCount} product(s) linked`);
    }
    const b = await (this.prisma as any).productBrand.findFirst({ where: { id, tenantId } });
    if (!b) throw new NotFoundException('Brand not found');
    await (this.prisma as any).productBrand.delete({ where: { id } });
  }
}
