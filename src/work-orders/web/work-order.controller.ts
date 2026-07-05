import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { WorkOrdersService } from '../work-orders.service';
import { OperationsService } from '../operations.service';
import { ComponentsService } from '../components.service';

@ApiTags('Work Orders')
@Controller('web/work-orders')
@UseGuards(JwtAuthGuard, CaslGuard)
export class WorkOrderWebController {
  constructor(
    private readonly workOrdersService: WorkOrdersService,
    private readonly operationsService: OperationsService,
    private readonly componentsService: ComponentsService,
  ) {}

  @Post()
  @CheckAbility({ action: WmsAction.Create, subject: 'WorkOrder' })
  @AuditLog({ eventType: 'WORK_ORDER_CREATE' })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.workOrdersService.create(tenantId, { ...dto, createdBy: userId });
  }

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'WorkOrder' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.workOrdersService.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'WorkOrder' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.workOrdersService.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: WmsAction.Update, subject: 'WorkOrder' })
  @AuditLog({ eventType: 'WORK_ORDER_UPDATE' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.workOrdersService.update(tenantId, BigInt(id), { ...dto, updatedBy: userId });
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'WorkOrder' })
  @AuditLog({ eventType: 'WORK_ORDER_DELETE' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.workOrdersService.delete(tenantId, BigInt(id));
  }

  @Post(':id/release')
  @CheckAbility({ action: WmsAction.Release, subject: 'WorkOrder' })
  @AuditLog({ eventType: 'WORK_ORDER_RELEASE' })
  async release(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub || req.rfSession?.userId;
    return this.workOrdersService.release(tenantId, BigInt(id), userId);
  }

  @Post(':id/complete')
  @CheckAbility({ action: WmsAction.Update, subject: 'WorkOrder' })
  @AuditLog({ eventType: 'WORK_ORDER_COMPLETE' })
  async complete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub || req.rfSession?.userId;
    return this.workOrdersService.complete(tenantId, BigInt(id), userId);
  }

  @Post(':id/cancel')
  @CheckAbility({ action: WmsAction.Cancel, subject: 'WorkOrder' })
  @AuditLog({ eventType: 'WORK_ORDER_CANCEL' })
  async cancel(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub || req.rfSession?.userId;
    return this.workOrdersService.cancel(tenantId, BigInt(id), userId);
  }

  @Get(':id/operations')
  @CheckAbility({ action: WmsAction.List, subject: 'WorkOrderOperation' })
  async findOperations(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.operationsService.findOperationsByWorkOrderId(tenantId, BigInt(id));
  }

  @Post(':id/operations')
  @CheckAbility({ action: WmsAction.Create, subject: 'WorkOrderOperation' })
  @AuditLog({ eventType: 'WORK_ORDER_OPERATION_CREATE' })
  async startOperation(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.operationsService.startOperation(tenantId, BigInt(dto.operationId), userId);
  }

  @Delete(':id/operations/:operationId')
  @CheckAbility({ action: WmsAction.Delete, subject: 'WorkOrderOperation' })
  @AuditLog({ eventType: 'WORK_ORDER_OPERATION_DELETE' })
  async deleteOperation(@Req() req: any, @Param('id') id: string, @Param('operationId') operationId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.operationsService.delete(tenantId, BigInt(id), BigInt(operationId));
  }

  @Get(':id/components')
  @CheckAbility({ action: WmsAction.List, subject: 'WorkOrderComponent' })
  async findComponents(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.componentsService.findComponentsByWorkOrderId(tenantId, BigInt(id));
  }

  @Post(':id/components')
  @CheckAbility({ action: WmsAction.Create, subject: 'WorkOrderComponent' })
  @AuditLog({ eventType: 'WORK_ORDER_COMPONENT_ADD' })
  async addComponent(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.componentsService.addComponent(tenantId, BigInt(id), { ...dto, createdBy: userId });
  }

  @Delete(':id/components/:componentId')
  @CheckAbility({ action: WmsAction.Delete, subject: 'WorkOrderComponent' })
  @AuditLog({ eventType: 'WORK_ORDER_COMPONENT_DELETE' })
  async deleteComponent(@Req() req: any, @Param('id') id: string, @Param('componentId') componentId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.componentsService.delete(tenantId, BigInt(id), BigInt(componentId));
  }
}
