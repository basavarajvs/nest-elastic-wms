import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { AllocationService } from '../allocations/allocation.service';

@ApiTags('Inventory')
@Controller('web')
@UseGuards(JwtAuthGuard, CaslGuard)
export class AllocationWebController {
  constructor(private readonly service: AllocationService) {}

  @Post('inventory-allocations')
  @CheckAbility({ action: WmsAction.Create, subject: 'InventoryAllocation' })
  @AuditLog({ eventType: 'ALLOCATION_CREATE' })
  async createAllocation(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get('inventory-allocations')
  @CheckAbility({ action: WmsAction.List, subject: 'InventoryAllocation' })
  async findAllAllocations(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get('allocation-rules')
  @CheckAbility({ action: WmsAction.List, subject: 'InventoryAllocation' })
  async findRules(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findRules(tenantId, query);
  }

  @Post('allocation-rules')
  @CheckAbility({ action: WmsAction.Create, subject: 'InventoryAllocation' })
  @AuditLog({ eventType: 'ALLOCATION_RULE_CREATE' })
  async createRule(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.createRule(tenantId, dto);
  }

  @Patch('allocation-rules/:id')
  @CheckAbility({ action: WmsAction.Update, subject: 'InventoryAllocation' })
  @AuditLog({ eventType: 'ALLOCATION_RULE_UPDATE' })
  async updateRule(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.updateRule(tenantId, id, dto);
  }

  @Delete('inventory-allocations/:id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'InventoryAllocation' })
  @AuditLog({ eventType: 'ALLOCATION_DELETE' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
