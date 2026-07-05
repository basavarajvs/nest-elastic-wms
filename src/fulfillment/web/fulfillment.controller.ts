import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { FulfillmentWorkflowService } from '../fulfillment-workflow.service';
import { FulfillmentBillingService } from '../fulfillment-billing.service';

@ApiTags('Fulfillment')
@Controller('web')
@UseGuards(JwtAuthGuard, CaslGuard)
export class FulfillmentWebController {
  constructor(
    private readonly workflowService: FulfillmentWorkflowService,
    private readonly billingService: FulfillmentBillingService,
  ) {}

  // ─── Workflow Definitions ──────────────────────────────────────────

  @Post('fulfillment/workflow-definitions')
  @CheckAbility({ action: WmsAction.Create, subject: 'FulfillmentWorkflowEvent' })
  @AuditLog({ eventType: 'WORKFLOW_DEFINITION_CREATE' })
  async createDefinition(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.workflowService.createDefinition(tenantId, dto);
  }

  @Get('fulfillment/workflow-definitions')
  @CheckAbility({ action: WmsAction.List, subject: 'FulfillmentWorkflowEvent' })
  async findAllDefinitions(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.workflowService.findAllDefinitions(tenantId, query);
  }

  @Get('fulfillment/workflow-definitions/:id')
  @CheckAbility({ action: WmsAction.Read, subject: 'FulfillmentWorkflowEvent' })
  async findDefinitionById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.workflowService.findDefinitionById(tenantId, BigInt(id));
  }

  @Patch('fulfillment/workflow-definitions/:id')
  @CheckAbility({ action: WmsAction.Update, subject: 'FulfillmentWorkflowEvent' })
  @AuditLog({ eventType: 'WORKFLOW_DEFINITION_UPDATE' })
  async updateDefinition(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.workflowService.updateDefinition(tenantId, BigInt(id), dto);
  }

  @Delete('fulfillment/workflow-definitions/:id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'FulfillmentWorkflowEvent' })
  @AuditLog({ eventType: 'WORKFLOW_DEFINITION_DELETE' })
  async deleteDefinition(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.workflowService.deleteDefinition(tenantId, BigInt(id));
  }

  // ─── Workflow Executions ───────────────────────────────────────────

  @Get('fulfillment/executions')
  @CheckAbility({ action: WmsAction.List, subject: 'FulfillmentWorkflowEvent' })
  async findAllExecutions(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.workflowService.findAllExecutions(tenantId, query);
  }

  // ─── Workflow Events ───────────────────────────────────────────────

  @Get('workflows/instances/:id/events')
  @CheckAbility({ action: WmsAction.List, subject: 'FulfillmentWorkflowEvent' })
  async findEventsByExecutionId(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.workflowService.findEventsByExecutionId(tenantId, BigInt(id));
  }

  // ─── Workflow Transitions ──────────────────────────────────────────

  @Get('workflows/instances/:id/transitions')
  @CheckAbility({ action: WmsAction.List, subject: 'FulfillmentWorkflowTransition' })
  async findTransitionsByExecutionId(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.workflowService.findTransitionsByExecutionId(tenantId, BigInt(id));
  }

  // ─── Billing Runs ──────────────────────────────────────────────────

  @Post('fulfillment-billing/runs')
  @CheckAbility({ action: WmsAction.Create, subject: 'FulfillmentBillingRun' })
  @AuditLog({ eventType: 'BILLING_RUN_CREATE' })
  async createBillingRun(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.billingService.createBillingRun(tenantId, dto);
  }

  @Get('fulfillment-billing/runs')
  @CheckAbility({ action: WmsAction.List, subject: 'FulfillmentBillingRun' })
  async findAllBillingRuns(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.billingService.findAllBillingRuns(tenantId, query);
  }

  @Get('fulfillment-billing/runs/:id')
  @CheckAbility({ action: WmsAction.Read, subject: 'FulfillmentBillingRun' })
  async findBillingRunById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.billingService.findBillingRunById(tenantId, BigInt(id));
  }

  @Post('fulfillment-billing/runs/:id/link-events')
  @CheckAbility({ action: WmsAction.Update, subject: 'FulfillmentBillingRun' })
  @AuditLog({ eventType: 'BILLING_RUN_LINK_EVENTS' })
  async linkEventsToRun(
    @Req() req: any,
    @Param('id') id: string,
    @Body('eventIds') eventIds: string[],
  ) {
    const tenantId = req.tenantContext.getTenantId();
    return this.billingService.linkEventsToRun(
      tenantId,
      BigInt(id),
      eventIds.map((e) => BigInt(e)),
    );
  }

  @Post('fulfillment-billing/runs/:id/status')
  @CheckAbility({ action: WmsAction.Update, subject: 'FulfillmentBillingRun' })
  @AuditLog({ eventType: 'BILLING_RUN_STATUS_UPDATE' })
  async updateBillingRunStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    const tenantId = req.tenantContext.getTenantId();
    return this.billingService.updateBillingRunStatus(tenantId, BigInt(id), status);
  }

  @Delete('fulfillment-billing/runs/:id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'FulfillmentBillingRun' })
  @AuditLog({ eventType: 'BILLING_RUN_DELETE' })
  async deleteBillingRun(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.billingService.delete(tenantId, BigInt(id));
  }

  // ─── Billing Events ────────────────────────────────────────────────

  @Post('fulfillment-billing/events')
  @CheckAbility({ action: WmsAction.Create, subject: 'FulfillmentBillingEvent' })
  @AuditLog({ eventType: 'BILLING_EVENT_CREATE' })
  async createBillingEvent(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.billingService.createBillingEvent(tenantId, dto);
  }

  @Get('fulfillment-billing/events')
  @CheckAbility({ action: WmsAction.List, subject: 'FulfillmentBillingEvent' })
  async findAllBillingEvents(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.billingService.findAllBillingEvents(tenantId, query);
  }

  @Get('fulfillment-billing/events/charges')
  @CheckAbility({ action: WmsAction.Read, subject: 'FulfillmentBillingEvent' })
  async calculateEventCharges(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.billingService.calculateEventCharges(tenantId, query);
  }
}
