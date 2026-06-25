import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { WorkOrdersService } from '../work-orders.service';
import { OperationsService } from '../operations.service';
import { ComponentsService } from '../components.service';
import { CreateWorkOrderDto, UpdateWorkOrderDto, CreateOperationDto, UpdateOperationDto, CreateComponentDto } from '../dtos/create-work-order.dto';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/work-orders')
@UseGuards(CaslGuard)
export class WorkOrdersWebController {
  constructor(
    private readonly workOrdersService: WorkOrdersService,
    private readonly operationsService: OperationsService,
    private readonly componentsService: ComponentsService,
  ) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'WorkOrder' })
  @ApiOperation({ summary: 'Create a work order' })
  async create(@Body() dto: CreateWorkOrderDto, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    return this.workOrdersService.create(dto, req.tenantContext.getTenantId(), userId);
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'WorkOrder' })
  @ApiOperation({ summary: 'List work orders' })
  async findAll(
    @Req() req: any,
    @Query('status') status: string,
    @Query('facilityId') facilityId: string,
    @Query('workOrderType') workOrderType: string,
  ) {
    return this.workOrdersService.findAll(req.tenantContext.getTenantId(), { status, facilityId, workOrderType });
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'WorkOrder' })
  @ApiOperation({ summary: 'Get work order by ID' })
  async findById(@Param('id') id: string, @Req() req: any) {
    return this.workOrdersService.findById(id, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'WorkOrder' })
  @ApiOperation({ summary: 'Update work order' })
  async update(@Param('id') id: string, @Body() dto: UpdateWorkOrderDto, @Req() req: any) {
    return this.workOrdersService.update(id, dto, req.tenantContext.getTenantId());
  }

  @Post(':id/release')
  @CheckAbility({ action: 'release', subject: 'WorkOrder' })
  @ApiOperation({ summary: 'Release work order (DRAFT → RELEASED)' })
  async release(@Param('id') id: string, @Req() req: any) {
    return this.workOrdersService.release(id, req.tenantContext.getTenantId());
  }

  @Post(':id/complete')
  @CheckAbility({ action: 'update', subject: 'WorkOrder' })
  @ApiOperation({ summary: 'Complete work order' })
  async complete(@Param('id') id: string, @Req() req: any) {
    return this.workOrdersService.complete(id, req.tenantContext.getTenantId());
  }

  @Post(':id/cancel')
  @CheckAbility({ action: 'cancel', subject: 'WorkOrder' })
  @ApiOperation({ summary: 'Cancel work order' })
  async cancel(@Param('id') id: string, @Req() req: any) {
    return this.workOrdersService.cancel(id, req.tenantContext.getTenantId());
  }

  @Post(':id/operations')
  @CheckAbility({ action: 'update', subject: 'WorkOrder' })
  @ApiOperation({ summary: 'Add operation to work order' })
  async addOperation(@Param('id') id: string, @Body() dto: CreateOperationDto, @Req() req: any) {
    return this.operationsService.addOperation(id, dto, req.tenantContext.getTenantId());
  }

  @Patch(':id/operations/:opId')
  @CheckAbility({ action: 'update', subject: 'WorkOrder' })
  @ApiOperation({ summary: 'Update operation status' })
  async updateOperation(@Param('id') id: string, @Param('opId') opId: string, @Body() dto: UpdateOperationDto, @Req() req: any) {
    return this.operationsService.updateOperation(id, opId, dto, req.tenantContext.getTenantId());
  }

  @Post(':id/components')
  @CheckAbility({ action: 'update', subject: 'WorkOrder' })
  @ApiOperation({ summary: 'Add component requirement to work order' })
  async addComponent(@Param('id') id: string, @Body() dto: CreateComponentDto, @Req() req: any) {
    return this.componentsService.addComponent(id, dto, req.tenantContext.getTenantId());
  }
}
