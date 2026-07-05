import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VasExecutionService {
  private readonly logger = new Logger(VasExecutionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async deleteTask(tenantId: string, taskId: bigint) {
    return this.prisma.vas_execution_tasks.deleteMany({
      where: { tenant_id: tenantId, task_id: taskId },
    });
  }

  async createTask(tenantId: string, userId: string | undefined, dto: any) {
    const task = await this.prisma.vas_execution_tasks.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        task_number: dto.taskNumber,
        task_type: dto.taskType,
        vas_service_id: BigInt(dto.vasServiceId),
        service_code: dto.serviceCode,
        service_name: dto.serviceName,
        order_id: dto.orderId ? BigInt(dto.orderId) : undefined,
        order_line_id: dto.orderLineId ? BigInt(dto.orderLineId) : undefined,
        shipment_id: dto.shipmentId ? BigInt(dto.shipmentId) : undefined,
        inventory_item_id: dto.inventoryItemId ? BigInt(dto.inventoryItemId) : undefined,
        product_id: BigInt(dto.productId),
        product_sku: dto.productSku,
        product_name: dto.productName,
        quantity_required: dto.quantityRequired ?? 1,
        uom_id: dto.uomId ? BigInt(dto.uomId) : undefined,
        source_location_id: dto.sourceLocationId ? BigInt(dto.sourceLocationId) : undefined,
        work_station_id: dto.workStationId ? BigInt(dto.workStationId) : undefined,
        scheduled_start_time: dto.scheduledStartTime ? new Date(dto.scheduledStartTime) : undefined,
        scheduled_end_time: dto.scheduledEndTime ? new Date(dto.scheduledEndTime) : undefined,
        priority: dto.priority ?? 5,
        status: 'PENDING',
        assigned_to_user_id: userId ? BigInt(userId) : undefined,
        special_instructions: dto.specialInstructions,
        created_by: userId ? BigInt(userId) : undefined,
        updated_by: userId ? BigInt(userId) : undefined,
      },
    });

    if (dto.autoCharge !== false) {
      await this.calculateAndCreateCharge(tenantId, task.task_id, userId);
    }

    return task;
  }

  async findAllTasks(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.status) where.status = query.status;
    if (query.vasServiceId) where.vas_service_id = BigInt(query.vasServiceId);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.vas_execution_tasks.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.vas_execution_tasks.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findTaskById(tenantId: string, taskId: bigint) {
    const task = await this.prisma.vas_execution_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    if (!task) throw new NotFoundException('VAS execution task not found');
    return task;
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

    const completedQty = dto.quantityCompleted ?? task.quantity_required;
    const duration = dto.actualDurationMinutes;

    await this.prisma.vas_execution_tasks.updateMany({
      where: { tenant_id: tenantId, task_id: taskId },
      data: {
        status: 'COMPLETED',
        quantity_completed: completedQty,
        completed_at: new Date(),
        actual_duration_minutes: duration,
        execution_notes: dto.executionNotes,
        exception_notes: dto.exceptionNotes,
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

    const page = query.page || 1;
    const limit = query.limit || 20;
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
