import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { HoldService } from '../holds/hold.service';

@ApiTags('Inventory')
@Controller('web/inventory-holds')
@UseGuards(JwtAuthGuard, CaslGuard)
export class HoldWebController {
  constructor(private readonly service: HoldService) {}

  @Post()
  @CheckAbility({ action: WmsAction.Create, subject: 'InventoryHold' })
  @AuditLog({ eventType: 'HOLD_CREATE' })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'InventoryHold' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'InventoryHold' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, id);
  }

  @Patch(':id')
  @CheckAbility({ action: WmsAction.Update, subject: 'InventoryHold' })
  @AuditLog({ eventType: 'HOLD_UPDATE' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, id, dto);
  }

  @Post(':id/release')
  @CheckAbility({ action: WmsAction.Update, subject: 'InventoryHold' })
  @AuditLog({ eventType: 'HOLD_RELEASE' })
  async release(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub || req.rfSession?.userId;
    return this.service.release(tenantId, id, userId, dto?.reason, dto?.supervisorPinOverride);
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'InventoryHold' })
  @AuditLog({ eventType: 'HOLD_DELETE' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
