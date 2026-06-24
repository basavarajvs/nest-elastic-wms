import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { AllocationRulesService } from '../allocation-rules.service';
import {
  CreateAllocationRuleDto,
  UpdateAllocationRuleDto,
  CreateConstraintDto,
  CreateRuleLocationDto,
  EvaluateRulesDto,
} from '../dtos/allocation-rule.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Inventory')
@Controller('web/inventory/allocation-rules')
@UseGuards(CaslGuard)
export class AllocationRulesWebController {
  constructor(private readonly service: AllocationRulesService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'InventoryAllocationRule' })
  async create(@Req() req: any, @Body() dto: CreateAllocationRuleDto) {
    return this.service.create(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'InventoryAllocationRule' })
  @ApiQuery({ name: 'facilityId', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  async findAll(
    @Req() req: any,
    @Query('facilityId') facilityId?: string,
    @Query('isActive') isActive?: string,
  ) {
    const active = isActive === undefined ? undefined : isActive === 'true';
    return this.service.findAll(req.tenantContext.getTenantId(), facilityId, active);
  }

  @Post('evaluate')
  @CheckAbility({ action: 'read', subject: 'InventoryAllocationRule' })
  async evaluate(@Req() req: any, @Body() dto: EvaluateRulesDto) {
    return this.service.evaluate(dto, req.tenantContext.getTenantId());
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'InventoryAllocationRule' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.service.findById(id, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'InventoryAllocationRule' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateAllocationRuleDto) {
    return this.service.update(id, req.tenantContext.getTenantId(), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'InventoryAllocationRule' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.service.delete(id, req.tenantContext.getTenantId());
  }

  @Post(':id/constraints')
  @CheckAbility({ action: 'update', subject: 'InventoryAllocationRule' })
  async addConstraint(@Req() req: any, @Param('id') id: string, @Body() dto: CreateConstraintDto) {
    return this.service.addConstraint(id, req.tenantContext.getTenantId(), dto);
  }

  @Delete(':id/constraints/:constraintId')
  @CheckAbility({ action: 'update', subject: 'InventoryAllocationRule' })
  async removeConstraint(@Req() req: any, @Param('id') id: string, @Param('constraintId') constraintId: string) {
    return this.service.removeConstraint(id, constraintId, req.tenantContext.getTenantId());
  }

  @Post(':id/locations')
  @CheckAbility({ action: 'update', subject: 'InventoryAllocationRule' })
  async addLocation(@Req() req: any, @Param('id') id: string, @Body() dto: CreateRuleLocationDto) {
    return this.service.addLocation(id, req.tenantContext.getTenantId(), dto);
  }

  @Delete(':id/locations/:locationRecId')
  @CheckAbility({ action: 'update', subject: 'InventoryAllocationRule' })
  async removeLocation(@Req() req: any, @Param('id') id: string, @Param('locationRecId') locationRecId: string) {
    return this.service.removeLocation(id, locationRecId, req.tenantContext.getTenantId());
  }
}
