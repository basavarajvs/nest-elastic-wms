import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReceivingApprovalService {
  private readonly logger = new Logger(ReceivingApprovalService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createApproval(tenantId: string, dto: any) {
    return this.prisma.receiving_tolerance_configs.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        product_id: dto.product_id ? BigInt(dto.product_id) : undefined,
        vendor_id: dto.vendor_id ? BigInt(dto.vendor_id) : undefined,
        tolerance_type: dto.tolerance_type || 'PERCENTAGE',
        over_tolerance: dto.max_tolerance,
        under_tolerance: dto.min_tolerance,
        requires_supervisor_approval: true,
        is_active: true,
      },
    });
  }

  async getPendingApprovals(tenantId: string, facilityId: bigint) {
    return this.prisma.receiving_tolerance_configs.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, requires_supervisor_approval: true, is_active: true },
    });
  }

  async approve(tenantId: string, configId: bigint, approvedBy: string) {
    const config = await this.prisma.receiving_tolerance_configs.findFirst({
      where: { tenant_id: tenantId, config_id: configId },
    });
    if (!config) throw new NotFoundException('Approval config not found');
    await this.prisma.receiving_tolerance_configs.updateMany({
      where: { tenant_id: tenantId, config_id: configId },
      data: { requires_supervisor_approval: false },
    });
    return this.prisma.receiving_tolerance_configs.findFirst({
      where: { tenant_id: tenantId, config_id: configId },
    });
  }

  async reject(tenantId: string, configId: bigint, rejectedBy: string) {
    const config = await this.prisma.receiving_tolerance_configs.findFirst({
      where: { tenant_id: tenantId, config_id: configId },
    });
    if (!config) throw new NotFoundException('Approval config not found');
    await this.prisma.receiving_tolerance_configs.updateMany({
      where: { tenant_id: tenantId, config_id: configId },
      data: { is_active: false },
    });
    return this.prisma.receiving_tolerance_configs.findFirst({
      where: { tenant_id: tenantId, config_id: configId },
    });
  }
}
