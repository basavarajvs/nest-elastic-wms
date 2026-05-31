import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePackagingDto, UpdatePackagingDto } from './dtos/packaging.dto';

@Injectable()
export class ProductPackagingService {
  private readonly logger = new Logger(ProductPackagingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePackagingDto, tenantId: string) {
    const existing = await (this.prisma as any).productPackagingHierarchy.findFirst({
      where: { tenantId, productId: dto.productId, fromUomId: dto.fromUomId, toUomId: dto.toUomId },
    });
    if (existing) throw new BadRequestException('Packaging hierarchy entry already exists');

    return (this.prisma as any).productPackagingHierarchy.create({
      data: { tenantId, ...dto, isActive: dto.isActive ?? true },
    });
  }

  async findByProduct(productId: string, tenantId: string) {
    return (this.prisma as any).productPackagingHierarchy.findMany({
      where: { tenantId, productId },
    });
  }

  async findAll(tenantId: string, productId?: string) {
    const where: Record<string, any> = { tenantId };
    if (productId) where.productId = productId;
    return (this.prisma as any).productPackagingHierarchy.findMany({ where, orderBy: { productId: 'asc' } });
  }

  async update(id: string, tenantId: string, dto: UpdatePackagingDto) {
    const entry = await (this.prisma as any).productPackagingHierarchy.findFirst({ where: { id, tenantId } });
    if (!entry) throw new NotFoundException('Packaging entry not found');
    return (this.prisma as any).productPackagingHierarchy.update({ where: { id }, data: dto });
  }

  async delete(id: string, tenantId: string) {
    const entry = await (this.prisma as any).productPackagingHierarchy.findFirst({ where: { id, tenantId } });
    if (!entry) throw new NotFoundException('Packaging entry not found');
    await (this.prisma as any).productPackagingHierarchy.delete({ where: { id } });
  }

  async convert(fromUomId: string, toUomId: string, productId: string, quantity: number, tenantId: string) {
    // Forward conversion: fromUom -> toUom
    const forward = await (this.prisma as any).productPackagingHierarchy.findFirst({
      where: { tenantId, productId, fromUomId, toUomId, isActive: true },
    });
    if (forward) return { quantity: quantity * forward.conversionFactor };

    // Reverse conversion: toUom -> fromUom (invert factor)
    const reverse = await (this.prisma as any).productPackagingHierarchy.findFirst({
      where: { tenantId, productId, fromUomId: toUomId, toUomId: fromUomId, isActive: true },
    });
    if (reverse) return { quantity: quantity / reverse.conversionFactor };

    throw new BadRequestException('No packaging conversion path found');
  }
}
