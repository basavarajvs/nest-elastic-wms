import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FulfillmentWorkflowService {
  private readonly logger = new Logger(FulfillmentWorkflowService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Workflow Definitions ──────────────────────────────────────────

  async createDefinition(tenantId: string, dto: any) {
    return this.prisma.fulfillment_workflow_definitions.create({
      data: {
        tenant_id: tenantId,
        workflow_code: dto.workflow_code,
        workflow_name: dto.workflow_name,
        workflow_description: dto.workflow_description,
        entity_type: dto.entity_type,
        initial_status: dto.initial_status,
        auto_progression_enabled: dto.auto_progression_enabled ?? true,
        require_manual_approval: dto.require_manual_approval ?? false,
        max_retry_attempts: dto.max_retry_attempts ?? 3,
        retry_delay_seconds: dto.retry_delay_seconds ?? 300,
        is_active: dto.is_active ?? true,
      },
    });
  }

  async findAllDefinitions(tenantId: string, query: any = {}) {
    const where: any = { tenant_id: tenantId };
    if (query.entityType) where.entity_type = query.entityType;
    if (query.isActive !== undefined) where.is_active = query.isActive;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.fulfillment_workflow_definitions.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.fulfillment_workflow_definitions.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findDefinitionById(tenantId: string, id: bigint) {
    const def = await this.prisma.fulfillment_workflow_definitions.findFirst({
      where: { tenant_id: tenantId, workflow_id: id },
    });
    if (!def) throw new NotFoundException('Workflow definition not found');
    return def;
  }

  async updateDefinition(tenantId: string, id: bigint, dto: any) {
    await this.findDefinitionById(tenantId, id);
    return this.prisma.fulfillment_workflow_definitions.update({
      where: { workflow_id: id },
      data: {
        workflow_name: dto.workflow_name,
        workflow_description: dto.workflow_description,
        auto_progression_enabled: dto.auto_progression_enabled,
        require_manual_approval: dto.require_manual_approval,
        max_retry_attempts: dto.max_retry_attempts,
        retry_delay_seconds: dto.retry_delay_seconds,
        is_active: dto.is_active,
      },
    });
  }

  async deleteDefinition(tenantId: string, id: bigint) {
    await this.findDefinitionById(tenantId, id);
    return this.prisma.fulfillment_workflow_definitions.delete({
      where: { workflow_id: id },
    });
  }

  // ─── Workflow Executions ───────────────────────────────────────────

  async findAllExecutions(tenantId: string, query: any = {}) {
    const where: any = { tenant_id: tenantId };
    if (query.executionStatus) where.execution_status = query.executionStatus;
    if (query.handlerName) where.handler_name = query.handlerName;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.fulfillment_workflow_executions.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { started_at: 'desc' },
        include: {
          fulfillment_workflow_events: true,
        },
      }),
      this.prisma.fulfillment_workflow_executions.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findExecutionById(tenantId: string, id: bigint) {
    const exec = await this.prisma.fulfillment_workflow_executions.findFirst({
      where: { tenant_id: tenantId, execution_id: id },
      include: {
        fulfillment_workflow_events: true,
        other_fulfillment_workflow_executions: true,
      },
    });
    if (!exec) throw new NotFoundException('Workflow execution not found');
    return exec;
  }

  // ─── Workflow Events ───────────────────────────────────────────────

  async recordEvent(tenantId: string, dto: any) {
    return this.prisma.fulfillment_workflow_events.create({
      data: {
        tenant_id: tenantId,
        workflow_id: BigInt(dto.workflowId),
        entity_type: dto.entityType,
        entity_id: BigInt(dto.entityId),
        entity_reference: dto.entityReference,
        from_status: dto.fromStatus,
        to_status: dto.toStatus,
        event_payload: dto.eventPayload,
        event_status: dto.eventStatus ?? 'PENDING',
        handler_name: dto.handlerName,
        triggered_by_user_id: dto.triggeredByUserId,
      },
    });
  }

  async findEventsByExecutionId(tenantId: string, executionId: bigint) {
    const exec = await this.prisma.fulfillment_workflow_executions.findFirst({
      where: { tenant_id: tenantId, execution_id: executionId },
      select: { workflow_event_id: true },
    });
    if (!exec) throw new NotFoundException('Workflow execution not found');
    return this.prisma.fulfillment_workflow_events.findMany({
      where: { tenant_id: tenantId, event_id: exec.workflow_event_id },
      orderBy: { created_at: 'desc' },
    });
  }

  async findEventsByWorkflowAndEntity(
    tenantId: string,
    workflowId: bigint,
    entityType: string,
    entityId: bigint,
  ) {
    return this.prisma.fulfillment_workflow_events.findMany({
      where: {
        tenant_id: tenantId,
        workflow_id: workflowId,
        entity_type: entityType,
        entity_id: entityId,
      },
      orderBy: { created_at: 'asc' },
    });
  }

  // ─── Workflow Transitions ──────────────────────────────────────────

  async findTransitionsByExecutionId(tenantId: string, executionId: bigint) {
    const exec = await this.prisma.fulfillment_workflow_executions.findFirst({
      where: { tenant_id: tenantId, execution_id: executionId },
      select: { workflow_event_id: true },
    });
    if (!exec) throw new NotFoundException('Workflow execution not found');

    const event = await this.prisma.fulfillment_workflow_events.findFirst({
      where: { tenant_id: tenantId, event_id: exec.workflow_event_id },
    });
    if (!event) return [];

    const def = await this.prisma.fulfillment_workflow_definitions.findFirst({
      where: { tenant_id: tenantId, workflow_id: event.workflow_id },
    });
    if (!def) return [];

    return this.prisma.fulfillment_workflow_transitions.findMany({
      where: {
        tenant_id: tenantId,
        workflow_id: def.workflow_id,
        is_active: true,
      },
      orderBy: { priority: 'asc' },
    });
  }

  async findTransitionsByWorkflowId(tenantId: string, workflowId: bigint) {
    return this.prisma.fulfillment_workflow_transitions.findMany({
      where: { tenant_id: tenantId, workflow_id: workflowId, is_active: true },
      orderBy: { priority: 'asc' },
    });
  }

  // ─── Event Recording for Pick → Pack → Ship ───────────────────────

  async recordPickEvent(tenantId: string, salesOrderId: bigint, userId?: string) {
    return this.recordEvent(tenantId, {
      workflowId: await this.resolveWorkflowId('SALES_ORDER'),
      entityType: 'SALES_ORDER',
      entityId: salesOrderId.toString(),
      fromStatus: 'PICKING',
      toStatus: 'PICKED',
      handlerName: 'pickHandler',
      triggeredByUserId: userId,
      eventPayload: { action: 'pick_completed' },
    });
  }

  async recordPackEvent(tenantId: string, salesOrderId: bigint, userId?: string) {
    return this.recordEvent(tenantId, {
      workflowId: await this.resolveWorkflowId('SALES_ORDER'),
      entityType: 'SALES_ORDER',
      entityId: salesOrderId.toString(),
      fromStatus: 'PACKING',
      toStatus: 'PACKED',
      handlerName: 'packHandler',
      triggeredByUserId: userId,
      eventPayload: { action: 'pack_completed' },
    });
  }

  async recordShipEvent(tenantId: string, salesOrderId: bigint, userId?: string) {
    return this.recordEvent(tenantId, {
      workflowId: await this.resolveWorkflowId('SALES_ORDER'),
      entityType: 'SALES_ORDER',
      entityId: salesOrderId.toString(),
      fromStatus: 'SHIPPING',
      toStatus: 'SHIPPED',
      handlerName: 'shipHandler',
      triggeredByUserId: userId,
      eventPayload: { action: 'ship_completed' },
    });
  }

  private async resolveWorkflowId(entityType: string): Promise<bigint> {
    const def = await this.prisma.fulfillment_workflow_definitions.findFirst({
      where: { entity_type: entityType, is_active: true },
      orderBy: { created_at: 'desc' },
    });
    if (!def) throw new NotFoundException(`No active workflow definition for entity type ${entityType}`);
    return def.workflow_id;
  }
}
