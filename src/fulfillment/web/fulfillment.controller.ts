import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { FulfillmentWorkflowService } from '../fulfillment-workflow.service';
import { FulfillmentBillingService } from '../fulfillment-billing.service';
import {
  FulfillmentWorkflowDefinitionDto,
  WorkflowDefinitionListResponseDto,
  FulfillmentWorkflowExecutionDto,
  WorkflowExecutionListResponseDto,
  FulfillmentWorkflowEventDto,
  FulfillmentWorkflowTransitionDto,
  FulfillmentBillingRunDto,
  BillingRunListResponseDto,
  FulfillmentBillingRunDetailDto,
  FulfillmentBillingEventDto,
  BillingEventListResponseDto,
  LinkEventsResultDto,
  FulfillmentBillingAggregationDto,
  CreateWorkflowDefinitionDto,
  UpdateWorkflowDefinitionDto,
  CreateFulfillmentBillingRunDto,
  CreateFulfillmentBillingEventDto,
} from '../dtos/fulfillment-response.dto';
import { DeleteResultDto } from '../../common/dto/paginated-response.dto';

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
  @ApiOperation({ summary: 'Create workflow definition' })
  @ApiCreatedResponse({ type: FulfillmentWorkflowDefinitionDto })
  async createDefinition(@Req() req: any, @Body() dto: CreateWorkflowDefinitionDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.workflowService.createDefinition(tenantId, dto);
  }

  @Get('fulfillment/workflow-definitions')
  @CheckAbility({ action: WmsAction.List, subject: 'FulfillmentWorkflowEvent' })
  @ApiOperation({ summary: 'List workflow definitions' })
  @ApiOkResponse({ type: WorkflowDefinitionListResponseDto })
  async findAllDefinitions(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.workflowService.findAllDefinitions(tenantId, query);
  }

  @Get('fulfillment/workflow-definitions/:id')
  @CheckAbility({ action: WmsAction.Read, subject: 'FulfillmentWorkflowEvent' })
  @ApiOperation({ summary: 'Get workflow definition by ID' })
  @ApiOkResponse({ type: FulfillmentWorkflowDefinitionDto })
  async findDefinitionById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.workflowService.findDefinitionById(tenantId, BigInt(id));
  }

  @Patch('fulfillment/workflow-definitions/:id')
  @CheckAbility({ action: WmsAction.Update, subject: 'FulfillmentWorkflowEvent' })
  @AuditLog({ eventType: 'WORKFLOW_DEFINITION_UPDATE' })
  @ApiOperation({ summary: 'Update workflow definition' })
  @ApiOkResponse({ type: FulfillmentWorkflowDefinitionDto })
  async updateDefinition(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateWorkflowDefinitionDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.workflowService.updateDefinition(tenantId, BigInt(id), dto);
  }

  @Delete('fulfillment/workflow-definitions/:id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'FulfillmentWorkflowEvent' })
  @AuditLog({ eventType: 'WORKFLOW_DEFINITION_DELETE' })
  @ApiOperation({ summary: 'Delete workflow definition' })
  @ApiOkResponse({ type: FulfillmentWorkflowDefinitionDto })
  async deleteDefinition(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.workflowService.deleteDefinition(tenantId, BigInt(id));
  }

  // ─── Workflow Executions ───────────────────────────────────────────

  @Get('fulfillment/executions')
  @CheckAbility({ action: WmsAction.List, subject: 'FulfillmentWorkflowEvent' })
  @ApiOperation({ summary: 'List workflow executions' })
  @ApiOkResponse({ type: WorkflowExecutionListResponseDto })
  async findAllExecutions(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.workflowService.findAllExecutions(tenantId, query);
  }

  // ─── Workflow Events ───────────────────────────────────────────────

  @Get('workflows/instances/:id/events')
  @CheckAbility({ action: WmsAction.List, subject: 'FulfillmentWorkflowEvent' })
  @ApiOperation({ summary: 'Get events by execution ID' })
  @ApiOkResponse({ type: FulfillmentWorkflowEventDto, isArray: true })
  async findEventsByExecutionId(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.workflowService.findEventsByExecutionId(tenantId, BigInt(id));
  }

  // ─── Workflow Transitions ──────────────────────────────────────────

  @Get('workflows/instances/:id/transitions')
  @CheckAbility({ action: WmsAction.List, subject: 'FulfillmentWorkflowTransition' })
  @ApiOperation({ summary: 'Get transitions by execution ID' })
  @ApiOkResponse({ type: FulfillmentWorkflowTransitionDto, isArray: true })
  async findTransitionsByExecutionId(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.workflowService.findTransitionsByExecutionId(tenantId, BigInt(id));
  }

  // ─── Billing Runs ──────────────────────────────────────────────────

  @Post('fulfillment-billing/runs')
  @CheckAbility({ action: WmsAction.Create, subject: 'FulfillmentBillingRun' })
  @AuditLog({ eventType: 'BILLING_RUN_CREATE' })
  @ApiOperation({ summary: 'Create billing run' })
  @ApiCreatedResponse({ type: FulfillmentBillingRunDto })
  async createBillingRun(@Req() req: any, @Body() dto: CreateFulfillmentBillingRunDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.billingService.createBillingRun(tenantId, dto);
  }

  @Get('fulfillment-billing/runs')
  @CheckAbility({ action: WmsAction.List, subject: 'FulfillmentBillingRun' })
  @ApiOperation({ summary: 'List billing runs' })
  @ApiOkResponse({ type: BillingRunListResponseDto })
  async findAllBillingRuns(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.billingService.findAllBillingRuns(tenantId, query);
  }

  @Get('fulfillment-billing/runs/:id')
  @CheckAbility({ action: WmsAction.Read, subject: 'FulfillmentBillingRun' })
  @ApiOperation({ summary: 'Get billing run by ID' })
  @ApiOkResponse({ type: FulfillmentBillingRunDetailDto })
  async findBillingRunById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.billingService.findBillingRunById(tenantId, BigInt(id));
  }

  @Post('fulfillment-billing/runs/:id/link-events')
  @CheckAbility({ action: WmsAction.Update, subject: 'FulfillmentBillingRun' })
  @AuditLog({ eventType: 'BILLING_RUN_LINK_EVENTS' })
  @ApiOperation({ summary: 'Link events to billing run' })
  @ApiCreatedResponse({ type: LinkEventsResultDto })
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
  @ApiOperation({ summary: 'Update billing run status' })
  @ApiOkResponse({ type: FulfillmentBillingRunDto })
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
  @ApiOperation({ summary: 'Delete billing run' })
  @ApiOkResponse({ type: DeleteResultDto })
  async deleteBillingRun(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.billingService.delete(tenantId, BigInt(id));
  }

  // ─── Billing Events ────────────────────────────────────────────────

  @Post('fulfillment-billing/events')
  @CheckAbility({ action: WmsAction.Create, subject: 'FulfillmentBillingEvent' })
  @AuditLog({ eventType: 'BILLING_EVENT_CREATE' })
  @ApiOperation({ summary: 'Create billing event' })
  @ApiCreatedResponse({ type: FulfillmentBillingEventDto })
  async createBillingEvent(@Req() req: any, @Body() dto: CreateFulfillmentBillingEventDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.billingService.createBillingEvent(tenantId, dto);
  }

  @Get('fulfillment-billing/events')
  @CheckAbility({ action: WmsAction.List, subject: 'FulfillmentBillingEvent' })
  @ApiOperation({ summary: 'List billing events' })
  @ApiOkResponse({ type: BillingEventListResponseDto })
  async findAllBillingEvents(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.billingService.findAllBillingEvents(tenantId, query);
  }

  @Get('fulfillment-billing/events/charges')
  @CheckAbility({ action: WmsAction.Read, subject: 'FulfillmentBillingEvent' })
  @ApiOperation({ summary: 'Calculate event charges' })
  @ApiOkResponse({ type: FulfillmentBillingAggregationDto })
  async calculateEventCharges(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.billingService.calculateEventCharges(tenantId, query);
  }
}
