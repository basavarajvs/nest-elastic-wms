import { Controller, Get, Post, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { AdjustmentService } from '../adjustments/adjustment.service';

@ApiTags('Inventory')
@Controller('web/inventory-adjustments')
@UseGuards(JwtAuthGuard, CaslGuard)
export class AdjustmentWebController {
  constructor(private readonly service: AdjustmentService) {}

  @Post()
  @CheckAbility({ action: WmsAction.Adjust, subject: 'InventoryAdjustment' })
  @AuditLog({ eventType: 'ADJUSTMENT_CREATE' })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'InventoryAdjustment' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'InventoryAdjustment' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, id);
  }

  @Post(':id/approve')
  @CheckAbility({ action: WmsAction.ApproveAdjustment, subject: 'InventoryAdjustment' })
  @AuditLog({ eventType: 'ADJUSTMENT_APPROVE' })
  async approve(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.service.approve(tenantId, id, userId);
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'InventoryAdjustment' })
  @AuditLog({ eventType: 'ADJUSTMENT_DELETE' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
