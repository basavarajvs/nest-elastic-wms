import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { HoldService } from '../holds/hold.service';
import { InventoryHoldResponseDto, PaginatedInventoryHoldResponseDto, CreateHoldDto, UpdateHoldDto, ReleaseHoldDto } from '../dtos/inventory-response.dto';

@ApiTags('Inventory')
@Controller('web/inventory-holds')
@UseGuards(JwtAuthGuard, CaslGuard)
export class HoldWebController {
  constructor(private readonly service: HoldService) {}

  @Post()
  @CheckAbility({ action: WmsAction.Create, subject: 'InventoryHold' })
  @AuditLog({ eventType: 'HOLD_CREATE' })
  @ApiCreatedResponse({ type: InventoryHoldResponseDto })
  async create(@Req() req: any, @Body() dto: CreateHoldDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'InventoryHold' })
  @ApiOkResponse({ type: PaginatedInventoryHoldResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'InventoryHold' })
  @ApiOkResponse({ type: InventoryHoldResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, id);
  }

  @Patch(':id')
  @CheckAbility({ action: WmsAction.Update, subject: 'InventoryHold' })
  @AuditLog({ eventType: 'HOLD_UPDATE' })
  @ApiOkResponse({ type: InventoryHoldResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateHoldDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, id, dto);
  }

  @Post(':id/release')
  @CheckAbility({ action: WmsAction.Update, subject: 'InventoryHold' })
  @AuditLog({ eventType: 'HOLD_RELEASE' })
  @ApiCreatedResponse({ type: InventoryHoldResponseDto })
  async release(@Req() req: any, @Param('id') id: string, @Body() dto: ReleaseHoldDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub || req.rfSession?.userId;
    return this.service.release(tenantId, id, userId, dto?.reason, dto?.supervisor_pin_override);
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'InventoryHold' })
  @AuditLog({ eventType: 'HOLD_DELETE' })
  @ApiOkResponse({ type: InventoryHoldResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
