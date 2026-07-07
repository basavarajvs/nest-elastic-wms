import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VasExecutionService {
  private readonly logger = new Logger(VasExecutionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async deleteTask(tenantId: string, taskId: bigint) {
    const task = await this.findTaskById(tenantId, taskId);
    await this.prisma.vas_execution_tasks.deleteMany({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    return task;
  }

  async createTask(tenantId: string, userId: string | undefined, dto: any) {
    const task = await this.prisma.vas_execution_tasks.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        task_number: dto.task_number,
        task_type: dto.task_type,
        vas_service_id: BigInt(dto.vas_service_id),
        service_code: dto.service_code,
        service_name: dto.service_name,
        order_id: dto.orderId ? BigInt(dto.orderId) : undefined,
        order_line_id: dto.order_line_id ? BigInt(dto.order_line_id) : undefined,
        sales_order_line_id: dto.sales_order_line_id ? BigInt(dto.sales_order_line_id) : undefined,
        shipment_id: dto.shipment_id ? BigInt(dto.shipment_id) : undefined,
        inventory_item_id: dto.inventory_item_id ? BigInt(dto.inventory_item_id) : undefined,
        product_id: BigInt(dto.productId),
        product_sku: dto.product_sku,
        product_name: dto.product_name,
        quantity_required: dto.quantity_required ?? 1,
        uom_id: dto.uomId ? BigInt(dto.uomId) : undefined,
        source_location_id: dto.source_location_id ? BigInt(dto.source_location_id) : undefined,
        source_wave_id: dto.source_wave_id ? BigInt(dto.source_wave_id) : undefined,
        source_picking_task_id: dto.source_picking_task_id ? BigInt(dto.source_picking_task_id) : undefined,
        work_station_id: dto.work_station_id ? BigInt(dto.work_station_id) : undefined,
        scheduled_start_time: dto.scheduled_start_time ? new Date(dto.scheduled_start_time) : undefined,
        scheduled_end_time: dto.scheduled_end_time ? new Date(dto.scheduled_end_time) : undefined,
        priority: dto.priority ?? 5,
        estimated_duration_minutes: dto.estimated_duration_minutes,
        quality_check_required: dto.quality_check_required,
        status: 'PENDING',
        assigned_to_user_id: userId ? BigInt(userId) : undefined,
        special_instructions: dto.special_instructions,
        execution_notes: dto.execution_notes,
        exception_notes: dto.exception_notes,
        attachments_json: dto.attachments_json,
        created_by: userId ? BigInt(userId) : undefined,
        updated_by: userId ? BigInt(userId) : undefined,
      },
    });

    if (dto.auto_charge !== false) {
      await this.calculateAndCreateCharge(tenantId, task.task_id, userId);
    }

    return task;
  }

  async findAllTasks(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.status) where.status = query.status;
    if (query.vasServiceId) where.vas_service_id = BigInt(query.vasServiceId);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const [rows, total] = await Promise.all([
      this.prisma.vas_execution_tasks.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { warehouse_facilities: true, vas_services: true, products: true },
      }),
      this.prisma.vas_execution_tasks.count({ where }),
    ]);
    const workstationIds = rows.map(r => r.work_station_id).filter(Boolean) as bigint[];
    const orderIds = rows.map(r => r.order_id).filter(Boolean) as bigint[];
    const [workstations, orders] = await Promise.all([
      workstationIds.length ? this.prisma.vas_workstations.findMany({ where: { tenant_id: tenantId, workstation_id: { in: workstationIds } } }) : [],
      orderIds.length ? this.prisma.sales_orders.findMany({ where: { tenant_id: tenantId, order_id: { in: orderIds } } }) : [],
    ]);
    const wsMap = new Map<bigint, string>(workstations.map(w => [w.workstation_id, w.workstation_name] as [bigint, string]));
    const orderMap = new Map<bigint, string>(orders.map(o => [o.order_id, o.order_number] as [bigint, string]));
    const data = rows.map(r => ({
      ...r,
      facility_name: r.warehouse_facilities?.facility_name,
      vas_service_name: r.vas_services?.vas_name,
      product_name: r.products?.product_name,
      order_number: r.order_id ? orderMap.get(r.order_id) : undefined,
      work_station_name: r.work_station_id ? wsMap.get(r.work_station_id) : undefined,
      warehouse_facilities: undefined,
      vas_services: undefined,
      products: undefined,
    }));
    return { data, total, page, limit };
  }

  async findTaskById(tenantId: string, taskId: bigint) {
    const task = await this.prisma.vas_execution_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
      include: { warehouse_facilities: true, vas_services: true, products: true },
    });
    if (!task) throw new NotFoundException('VAS execution task not found');
    let workStationName: string | undefined;
    let orderNumber: string | undefined;
    if (task.work_station_id) {
      const ws = await this.prisma.vas_workstations.findFirst({ where: { tenant_id: tenantId, workstation_id: task.work_station_id } });
      workStationName = ws?.workstation_name;
    }
    if (task.order_id) {
      const order = await this.prisma.sales_orders.findFirst({ where: { tenant_id: tenantId, order_id: task.order_id } });
      orderNumber = order?.order_number;
    }
    return {
      ...task,
      facility_name: task.warehouse_facilities?.facility_name,
      vas_service_name: task.vas_services?.vas_name,
      product_name: task.products?.product_name,
      order_number: orderNumber,
      work_station_name: workStationName,
      warehouse_facilities: undefined,
      vas_services: undefined,
      products: undefined,
    };
  }

  async startTask(tenantId: string, taskId: bigint, userId: string | undefined) {
    const task = await this.findTaskById(tenantId, taskId);
    if (task.status !== 'PENDING' && task.status !== 'ASSIGNED') {
      throw new BadRequestException(`Task cannot be started from status ${task.status}`);
    }

    await this.prisma.vas_execution_tasks.updateMany({
      where: { tenant_id: tenantId, task_id: taskId },
      data: {
        status: 'IN_PROGRESS',
        started_at: new Date(),
        assigned_to_user_id: userId ? BigInt(userId) : undefined,
        updated_by: userId ? BigInt(userId) : undefined,
      },
    });

    await this.prisma.vas_task_events.create({
      data: {
        tenant_id: tenantId,
        vas_task_id: taskId,
        event_type: 'TASK_STARTED',
        event_payload: { startedBy: userId, startedAt: new Date().toISOString() },
        recorded_by: userId ? BigInt(userId) : undefined,
      },
    });

    return this.findTaskById(tenantId, taskId);
  }

  async completeTask(tenantId: string, taskId: bigint, userId: string | undefined, dto: any) {
    const task = await this.findTaskById(tenantId, taskId);
    if (task.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Task must be IN_PROGRESS to complete');
    }

    const completedQty = dto.quantity_completed ?? task.quantity_required;
    const duration = dto.actual_duration_minutes;

    await this.prisma.vas_execution_tasks.updateMany({
      where: { tenant_id: tenantId, task_id: taskId },
      data: {
        status: 'COMPLETED',
        quantity_completed: completedQty,
        completed_at: new Date(),
        actual_duration_minutes: duration,
        execution_notes: dto.execution_notes,
        exception_notes: dto.exception_notes,
        updated_by: userId ? BigInt(userId) : undefined,
      },
    });

    await this.prisma.vas_task_events.create({
      data: {
        tenant_id: tenantId,
        vas_task_id: taskId,
        event_type: 'TASK_COMPLETED',
        event_payload: { completedBy: userId, completedAt: new Date().toISOString(), quantity: completedQty },
        recorded_by: userId ? BigInt(userId) : undefined,
      },
    });

    await this.calculateAndCreateCharge(tenantId, taskId, userId);

    return this.findTaskById(tenantId, taskId);
  }

  async findCharges(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.vasTaskId) where.vas_task_id = BigInt(query.vasTaskId);
    if (query.clientId) where.client_id = BigInt(query.clientId);
    if (query.chargeStatus) where.charge_status = query.chargeStatus;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const [data, total] = await Promise.all([
      this.prisma.vas_execution_charges.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.vas_execution_charges.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  private async calculateAndCreateCharge(tenantId: string, taskId: bigint, userId: string | undefined) {
    const task = await this.prisma.vas_execution_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    if (!task) return;

    const service = await this.prisma.vas_services.findFirst({
      where: { tenant_id: tenantId, vas_id: task.vas_service_id },
    });
    if (!service) return;

    let ratePerUnit = service.base_charge;
    const quantity = Number(task.quantity_completed || task.quantity_required);
    let lineTotal = Number(ratePerUnit) * quantity;

    if (service.minimum_charge && lineTotal < Number(service.minimum_charge)) {
      lineTotal = Number(service.minimum_charge);
    }
    if (service.maximum_charge && lineTotal > Number(service.maximum_charge)) {
      lineTotal = Number(service.maximum_charge);
    }

    const chargeNumber = `CHG-${task.task_number}-${Date.now()}`;

    await this.prisma.vas_execution_charges.create({
      data: {
        tenant_id: tenantId,
        facility_id: task.facility_id,
        charge_number: chargeNumber,
        vas_task_id: taskId,
        task_number: task.task_number,
        vas_service_id: task.vas_service_id,
        service_code: task.service_code,
        service_name: task.service_name,
        service_category: service.service_category,
        client_id: BigInt(0),
        order_id: task.order_id,
        product_id: task.product_id,
        product_sku: task.product_sku,
        product_name: task.product_name,
        quantity,
        rate_per_unit: ratePerUnit,
        line_total: lineTotal,
        currency_code: service.currency_code || 'USD',
        charge_status: 'UNBILLED',
        executed_by_user_id: userId ? BigInt(userId) : undefined,
        executed_at: new Date(),
        work_station_id: task.work_station_id,
        created_by: userId ? BigInt(userId) : undefined,
        updated_by: userId ? BigInt(userId) : undefined,
      },
    });
  }
}
