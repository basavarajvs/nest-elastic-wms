import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComponentsService {
  private readonly logger = new Logger(ComponentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async delete(tenantId: string, workOrderId: bigint, componentId: bigint) {
    return this.prisma.work_order_components.deleteMany({
      where: { tenant_id: tenantId, work_order_id: workOrderId, component_id: componentId },
    });
  }

  async findComponentsByWorkOrderId(tenantId: string, workOrderId: bigint) {
    return this.prisma.work_order_components.findMany({
      where: { tenant_id: tenantId, work_order_id: workOrderId },
      orderBy: { component_id: 'asc' },
    });
  }

  async addComponent(tenantId: string, workOrderId: bigint, dto: any) {
    return this.prisma.work_order_components.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        work_order_id: workOrderId,
        component_product_id: BigInt(dto.componentProductId),
        component_product_name: dto.componentProductName,
        component_product_code: dto.componentProductCode,
        required_quantity: dto.requiredQuantity,
        total_required_quantity: dto.totalRequiredQuantity,
        remaining_required_quantity: dto.remainingRequiredQuantity ?? dto.requiredQuantity,
        uom_id: BigInt(dto.uomId),
        notes: dto.notes,
        created_by: dto.createdBy,
      },
    });
  }

  async reserveComponents(tenantId: string, workOrderId: bigint) {
    return this.prisma.work_order_components.updateMany({
      where: { tenant_id: tenantId, work_order_id: workOrderId, status: 'PENDING' },
      data: { status: 'RESERVED' },
    });
  }
}
