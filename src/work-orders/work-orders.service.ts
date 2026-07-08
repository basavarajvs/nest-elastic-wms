import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkOrdersService {
  private readonly logger = new Logger(WorkOrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const data: any = {
      tenant_id: tenantId,
      facility_id: BigInt(dto.facility_id),
      work_order_number: dto.work_order_number,
      work_order_name: dto.work_order_name,
      description: dto.description,
      work_order_type: dto.work_order_type || 'ASSEMBLY',
      product_id: BigInt(dto.product_id),
      product_name: dto.product_name,
      product_code: dto.product_code,
      planned_quantity: dto.planned_quantity,
      uom_id: BigInt(dto.uom_id),
      priority: dto.priority ?? 10,
      assigned_to_user_id: dto.assigned_to_user_id,
      scheduled_start_date: dto.scheduled_start_date ? new Date(dto.scheduled_start_date) : undefined,
      scheduled_end_date: dto.scheduled_end_date ? new Date(dto.scheduled_end_date) : undefined,
      source_type: dto.source_type,
      source_reference_id: dto.source_reference_id ? BigInt(dto.source_reference_id) : undefined,
      notes: dto.notes,
    };

    if (dto.operations?.length > 0) {
      data.work_order_operations = {
        create: dto.operations.map((op: any, idx: number) => ({
          tenant_id: tenantId,
          facility_id: BigInt(dto.facility_id),
          operation_number: op.operation_number ?? idx + 1,
          operation_name: op.operation_name,
          description: op.description,
          required_equipment_type: op.required_equipment_type,
          required_skill_set: op.required_skill_set,
          standard_time_minutes: op.standard_time_minutes,
          notes: op.notes,
        })),
      };
    }

    if (dto.components?.length > 0) {
      data.work_order_components = {
        create: dto.components.map((comp: any) => ({
          tenant_id: tenantId,
          facility_id: BigInt(dto.facility_id),
          component_product_id: BigInt(comp.component_product_id),
          component_product_name: comp.component_product_name,
          component_product_code: comp.component_product_code,
          required_quantity: comp.required_quantity,
          total_required_quantity: comp.total_required_quantity,
          remaining_required_quantity: comp.remaining_required_quantity ?? comp.required_quantity,
          uom_id: BigInt(comp.uom_id),
          notes: comp.notes,
        })),
      };
    }

    return this.prisma.work_orders.create({ data });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, ...(query.facilityId ? { facility_id: BigInt(query.facilityId) } : {})  };
    if (query.status) where.status = query.status;
    if (query.workOrderType) where.work_order_type = query.workOrderType;
    if (query.assignedToUserId) where.assigned_to_user_id = query.assignedToUserId;
    if (query.search) {
      where.OR = [
        { work_order_number: { contains: query.search, mode: 'insensitive' } },
        { work_order_name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [rows, total] = await Promise.all([
      this.prisma.work_orders.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { warehouse_facilities: true },
      }),
      this.prisma.work_orders.count({ where }),
    ]);
    const data = rows.map(r => ({
      ...r,
      facility_name: r.warehouse_facilities?.facility_name,
      warehouse_facilities: undefined,
    }));
    return { data, total, page, limit };
  }

  async findById(tenantId: string, workOrderId: bigint) {
    const wo = await this.prisma.work_orders.findFirst({
      where: { tenant_id: tenantId, work_order_id: workOrderId },
      include: { warehouse_facilities: true },
    });
    if (!wo) return null;
    return {
      ...wo,
      facility_name: wo.warehouse_facilities?.facility_name,
      warehouse_facilities: undefined,
    };
  }

  async update(tenantId: string, workOrderId: bigint, dto: any) {
    const data: any = {};
    if (dto.work_order_name !== undefined) data.work_order_name = dto.work_order_name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.work_order_type !== undefined) data.work_order_type = dto.work_order_type;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.assigned_to_user_id !== undefined) data.assigned_to_user_id = dto.assigned_to_user_id;
    if (dto.scheduled_start_date !== undefined) data.scheduled_start_date = new Date(dto.scheduled_start_date);
    if (dto.scheduled_end_date !== undefined) data.scheduled_end_date = new Date(dto.scheduled_end_date);
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.updated_by !== undefined) data.updated_by = dto.updated_by;
    await this.prisma.work_orders.updateMany({
      where: { tenant_id: tenantId, work_order_id: workOrderId },
      data,
    });
    return this.findById(tenantId, workOrderId);
  }

  async delete(tenantId: string, workOrderId: bigint) {
    const entity = await this.findById(tenantId, workOrderId);
    await this.prisma.work_orders.deleteMany({
      where: { tenant_id: tenantId, work_order_id: workOrderId },
    });
    return entity;
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
