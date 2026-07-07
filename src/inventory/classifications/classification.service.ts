import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClassificationService {
  constructor(private readonly prisma: PrismaService) {}

  async delete(tenantId: string, id: bigint) {
    const entity = await this.prisma.product_velocity_classification.findFirst({
      where: { tenant_id: tenantId, classification_id: id },
    });
    await this.prisma.product_velocity_classification.deleteMany({
      where: { tenant_id: tenantId, classification_id: id },
    });
    return entity;
  }

  async getAbcClassifications(tenantId: string, facilityId?: string) {
    const where: any = { tenant_id: tenantId };
    if (facilityId) where.facility_id = BigInt(facilityId);

    const data = await this.prisma.product_velocity_classification.findMany({
      where,
      orderBy: [{ abc_class: 'asc' }, { velocity_rank: 'asc' }],
      include: { products: true },
    });
    return data.map(c => {
      const { products, ...rest } = c as any;
      return { ...rest, product_name: products?.product_name ?? null };
    });
  }

  async updateAbcClassification(tenantId: string, productId: string, abcClass: string, userId: string) {
    const existing = await this.prisma.product_velocity_classification.findFirst({
      where: { tenant_id: tenantId, product_id: BigInt(productId) },
    });
    if (!existing) throw new NotFoundException('Product classification not found');

    await this.prisma.product_velocity_classification.updateMany({
      where: { tenant_id: tenantId, product_id: BigInt(productId) },
      data: { abc_class: abcClass },
    });

    const result = await this.prisma.product_velocity_classification.findFirst({
      where: { tenant_id: tenantId, product_id: BigInt(productId) },
      include: { products: true },
    });
    const { products, ...rest } = result as any;
    return { ...rest, product_name: products?.product_name ?? null };
  }
}
