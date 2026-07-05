import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkOrdersService {
  private readonly logger = new Logger(WorkOrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const data: any = {
      tenant_id: tenantId,
      facility_id: BigInt(dto.facilityId),
      work_order_number: dto.workOrderNumber,
      work_order_name: dto.workOrderName,
      description: dto.description,
      work_order_type: dto.workOrderType || 'ASSEMBLY',
      product_id: BigInt(dto.productId),
      product_name: dto.productName,
      product_code: dto.productCode,
      planned_quantity: dto.plannedQuantity,
      uom_id: BigInt(dto.uomId),
      priority: dto.priority ?? 10,
      assigned_to_user_id: dto.assignedToUserId,
      scheduled_start_date: dto.scheduledStartDate ? new Date(dto.scheduledStartDate) : undefined,
      scheduled_end_date: dto.scheduledEndDate ? new Date(dto.scheduledEndDate) : undefined,
      source_type: dto.sourceType,
      source_reference_id: dto.sourceReferenceId ? BigInt(dto.sourceReferenceId) : undefined,
      notes: dto.notes,
      created_by: dto.createdBy,
    };

    if (dto.operations?.length > 0) {
      data.work_order_operations = {
        create: dto.operations.map((op: any, idx: number) => ({
          tenant_id: tenantId,
          facility_id: BigInt(dto.facilityId),
          operation_number: op.operationNumber ?? idx + 1,
          operation_name: op.operationName,
          description: op.description,
          required_equipment_type: op.requiredEquipmentType,
          required_skill_set: op.requiredSkillSet,
          standard_time_minutes: op.standardTimeMinutes,
          notes: op.notes,
          created_by: dto.createdBy,
        })),
      };
    }

    if (dto.components?.length > 0) {
      data.work_order_components = {
        create: dto.components.map((comp: any) => ({
          tenant_id: tenantId,
          facility_id: BigInt(dto.facilityId),
          component_product_id: BigInt(comp.componentProductId),
          component_product_name: comp.componentProductName,
          component_product_code: comp.componentProductCode,
          required_quantity: comp.requiredQuantity,
          total_required_quantity: comp.totalRequiredQuantity,
          remaining_required_quantity: comp.remainingRequiredQuantity ?? comp.requiredQuantity,
          uom_id: BigInt(comp.uomId),
          notes: comp.notes,
          created_by: dto.createdBy,
        })),
      };
    }

    return this.prisma.work_orders.create({ data });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, facility_id: BigInt(query.facilityId) };
    if (query.status) where.status = query.status;
    if (query.workOrderType) where.work_order_type = query.workOrderType;
    if (query.assignedToUserId) where.assigned_to_user_id = query.assignedToUserId;
    if (query.search) {
      where.OR = [
        { work_order_number: { contains: query.search, mode: 'insensitive' } },
        { work_order_name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.work_orders.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.work_orders.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, workOrderId: bigint) {
    return this.prisma.work_orders.findFirst({
      where: { tenant_id: tenantId, work_order_id: workOrderId },
    });
  }

  async update(tenantId: string, workOrderId: bigint, dto: any) {
    const data: any = {};
    if (dto.workOrderName !== undefined) data.work_order_name = dto.workOrderName;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.assignedToUserId !== undefined) data.assigned_to_user_id = dto.assignedToUserId;
    if (dto.scheduledStartDate !== undefined) data.scheduled_start_date = new Date(dto.scheduledStartDate);
    if (dto.scheduledEndDate !== undefined) data.scheduled_end_date = new Date(dto.scheduledEndDate);
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.updatedBy !== undefined) data.updated_by = dto.updatedBy;
    return this.prisma.work_orders.updateMany({
      where: { tenant_id: tenantId, work_order_id: workOrderId },
      data,
    });
  }

  async delete(tenantId: string, workOrderId: bigint) {
    return this.prisma.work_orders.deleteMany({
      where: { tenant_id: tenantId, work_order_id: workOrderId },
    });
  }

  async release(tenantId: string, workOrderId: bigint, userId?: string) {
    const wo = await this.prisma.work_orders.findFirst({
      where: { tenant_id: tenantId, work_order_id: workOrderId },
    });
    if (!wo) throw new NotFoundException('Work order not found');
    if (wo.status !== 'PENDING') throw new BadRequestException('Only PENDING work orders can be released');

    const now = new Date();
    await this.prisma.work_orders.updateMany({
      where: { tenant_id: tenantId, work_order_id: workOrderId },
      data: {
        status: 'IN_PROGRESS',
        released_date: now,
        started_at: now,
        actual_start_date: now,
        updated_by: userId,
      },
    });

    await this.prisma.work_order_components.updateMany({
      where: { tenant_id: tenantId, work_order_id: workOrderId, status: 'PENDING' },
      data: { status: 'RESERVED' },
    });

    return { success: true, message: 'Work order released' };
  }

  async complete(tenantId: string, workOrderId: bigint, userId?: string) {
    const wo = await this.prisma.work_orders.findFirst({
      where: { tenant_id: tenantId, work_order_id: workOrderId },
    });
    if (!wo) throw new NotFoundException('Work order not found');
    if (wo.status !== 'IN_PROGRESS') throw new BadRequestException('Only IN_PROGRESS work orders can be completed');

    const now = new Date();
    await this.prisma.work_orders.updateMany({
      where: { tenant_id: tenantId, work_order_id: workOrderId },
      data: {
        status: 'COMPLETED',
        completed_at: now,
        actual_end_date: now,
        fulfilled_quantity: wo.planned_quantity,
        progress_percentage: 100,
        updated_by: userId,
      },
    });

    return { success: true, message: 'Work order completed' };
  }

  async cancel(tenantId: string, workOrderId: bigint, userId?: string) {
    const wo = await this.prisma.work_orders.findFirst({
      where: { tenant_id: tenantId, work_order_id: workOrderId },
    });
    if (!wo) throw new NotFoundException('Work order not found');
    if (wo.status === 'COMPLETED' || wo.status === 'CANCELLED') {
      throw new BadRequestException('Cannot cancel completed or already cancelled work order');
    }

    await this.prisma.work_orders.updateMany({
      where: { tenant_id: tenantId, work_order_id: workOrderId },
      data: { status: 'CANCELLED', updated_by: userId },
    });

    return { success: true, message: 'Work order cancelled' };
  }
}
