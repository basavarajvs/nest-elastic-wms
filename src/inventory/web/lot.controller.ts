import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { LotService } from '../lots/lot.service';
import { InventoryLotResponseDto, PaginatedInventoryLotResponseDto, CreateLotDto, UpdateLotDto } from '../dtos/inventory-response.dto';

@ApiTags('Inventory')
@Controller('web/inventory-lots')
@UseGuards(JwtAuthGuard, CaslGuard)
export class LotWebController {
  constructor(private readonly service: LotService) {}

  @Post()
  @CheckAbility({ action: WmsAction.Create, subject: 'InventoryLot' })
  @AuditLog({ eventType: 'LOT_CREATE' })
  @ApiCreatedResponse({ type: InventoryLotResponseDto })
  async create(@Req() req: any, @Body() dto: CreateLotDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'InventoryLot' })
  @ApiOkResponse({ type: PaginatedInventoryLotResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'InventoryLot' })
  @ApiOkResponse({ type: InventoryLotResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, id);
  }

  @Patch(':id')
  @CheckAbility({ action: WmsAction.Update, subject: 'InventoryLot' })
  @AuditLog({ eventType: 'LOT_UPDATE' })
  @ApiOkResponse({ type: InventoryLotResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateLotDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, id, dto);
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'InventoryLot' })
  @AuditLog({ eventType: 'LOT_DELETE' })
  @ApiOkResponse({ type: InventoryLotResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
