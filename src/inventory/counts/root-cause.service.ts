import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RootCauseService {
  private readonly logger = new Logger(RootCauseService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createCategory(tenantId: string, dto: any) {
    const { code, description, category_type, is_active, ...rest } = dto;
    return this.prisma.root_cause_categories.create({
      data: {
        tenant_id: tenantId,
        code,
        description,
        category_type,
        is_active: is_active ?? true,
        ...rest,
      },
    });
  }

  async findAllCategories(tenantId: string) {
    return this.prisma.root_cause_categories.findMany({
      where: { tenant_id: tenantId, is_active: true },
      orderBy: { code: 'asc' },
    });
  }

  async assignRootCause(tenantId: string, investigationId: bigint, categoryId: bigint, description?: string) {
    const inv = await this.prisma.variance_investigations.findFirst({
      where: { tenant_id: tenantId, investigation_id: investigationId },
    });
    if (!inv) throw new NotFoundException('Investigation not found');
    await this.prisma.variance_investigations.updateMany({
      where: { tenant_id: tenantId, investigation_id: investigationId },
      data: { root_cause: description || 'Root cause assigned', corrective_action: description || null },
    });
    return this.prisma.variance_investigations.findFirst({
      where: { tenant_id: tenantId, investigation_id: investigationId },
    });
  }
}
