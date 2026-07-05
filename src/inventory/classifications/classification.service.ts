import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClassificationService {
  constructor(private readonly prisma: PrismaService) {}

  async delete(tenantId: string, id: bigint) {
    return this.prisma.product_velocity_classification.deleteMany({
      where: { tenant_id: tenantId, classification_id: id },
    });
  }

  async getAbcClassifications(tenantId: string, facilityId?: string) {
    const where: any = { tenant_id: tenantId };
    if (facilityId) where.facility_id = BigInt(facilityId);

    return this.prisma.product_velocity_classification.findMany({
      where,
      orderBy: [{ abc_class: 'asc' }, { velocity_rank: 'asc' }],
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

    return this.prisma.product_velocity_classification.findFirst({
      where: { tenant_id: tenantId, product_id: BigInt(productId) },
    });
  }
}
