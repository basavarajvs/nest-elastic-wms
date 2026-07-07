import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { LpnService } from '../lpn/lpn.service';
import { LpnResponseDto, PaginatedLpnResponseDto, LpnTransactionResponseDto, CreateLpnDto, UpdateLpnDto } from '../dtos/inventory-response.dto';

@ApiTags('Inventory')
@Controller('web/lpns')
@UseGuards(JwtAuthGuard, CaslGuard)
export class LpnWebController {
  constructor(private readonly service: LpnService) {}

  @Post()
  @CheckAbility({ action: WmsAction.Create, subject: 'LPN' })
  @AuditLog({ eventType: 'LPN_CREATE' })
  @ApiCreatedResponse({ type: LpnResponseDto })
  async create(@Req() req: any, @Body() dto: CreateLpnDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'LPN' })
  @ApiOkResponse({ type: PaginatedLpnResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'LPN' })
  @ApiOkResponse({ type: LpnResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, id);
  }

  @Patch(':id')
  @CheckAbility({ action: WmsAction.Update, subject: 'LPN' })
  @AuditLog({ eventType: 'LPN_UPDATE' })
  @ApiOkResponse({ type: LpnResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateLpnDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, id, dto);
  }

  @Post('barcode/:code')
  @CheckAbility({ action: WmsAction.Lookup, subject: 'LPN' })
  @ApiCreatedResponse({ type: LpnResponseDto })
  async findByBarcode(@Req() req: any, @Param('code') code: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findByBarcode(tenantId, code);
  }

  @Get(':id/transactions')
  @CheckAbility({ action: WmsAction.List, subject: 'LPN' })
  @ApiOkResponse({ type: [LpnTransactionResponseDto] })
  async getTransactions(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.getTransactions(tenantId, id);
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'LPN' })
  @AuditLog({ eventType: 'LPN_DELETE' })
  @ApiOkResponse({ type: LpnResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
