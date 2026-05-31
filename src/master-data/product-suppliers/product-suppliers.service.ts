import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductSupplierDto, UpdateProductSupplierDto } from './dtos/product-supplier.dto';

@Injectable()
export class ProductSuppliersService {
  private readonly logger = new Logger(ProductSuppliersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductSupplierDto, tenantId: string) {
    const existing = await (this.prisma as any).productSupplier.findFirst({
      where: { tenantId, productId: dto.productId, vendorId: dto.vendorId },
    });
    if (existing) throw new BadRequestException('Product supplier mapping already exists');

    return (this.prisma as any).productSupplier.create({
      data: { tenantId, ...dto, unitCost: dto.unitCost ?? undefined },
    });
  }

  async findAll(tenantId: string, productId?: string, vendorId?: string) {
    const where: Record<string, any> = { tenantId };
    if (productId) where.productId = productId;
    if (vendorId) where.vendorId = vendorId;
    return (this.prisma as any).productSupplier.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string, tenantId: string) {
    const ps = await (this.prisma as any).productSupplier.findFirst({ where: { id, tenantId } });
    if (!ps) throw new NotFoundException('Product supplier not found');
    return ps;
  }

  async update(id: string, tenantId: string, dto: UpdateProductSupplierDto) {
    const ps = await (this.prisma as any).productSupplier.findFirst({ where: { id, tenantId } });
    if (!ps) throw new NotFoundException('Product supplier not found');
    return (this.prisma as any).productSupplier.update({ where: { id }, data: dto });
  }

  async delete(id: string, tenantId: string) {
    const ps = await (this.prisma as any).productSupplier.findFirst({ where: { id, tenantId } });
    if (!ps) throw new NotFoundException('Product supplier not found');
    await (this.prisma as any).productSupplier.delete({ where: { id } });
  }
}
