import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { LpnService } from '../lpn/lpn.service';

@ApiTags('Inventory')
@Controller('web/lpns')
@UseGuards(JwtAuthGuard, CaslGuard)
export class LpnWebController {
  constructor(private readonly service: LpnService) {}

  @Post()
  @CheckAbility({ action: WmsAction.Create, subject: 'LPN' })
  @AuditLog({ eventType: 'LPN_CREATE' })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'LPN' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'LPN' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, id);
  }

  @Patch(':id')
  @CheckAbility({ action: WmsAction.Update, subject: 'LPN' })
  @AuditLog({ eventType: 'LPN_UPDATE' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, id, dto);
  }

  @Post('barcode/:code')
  @CheckAbility({ action: WmsAction.Lookup, subject: 'LPN' })
  async findByBarcode(@Req() req: any, @Param('code') code: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findByBarcode(tenantId, code);
  }

  @Get(':id/transactions')
  @CheckAbility({ action: WmsAction.List, subject: 'LPN' })
  async getTransactions(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.getTransactions(tenantId, id);
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'LPN' })
  @AuditLog({ eventType: 'LPN_DELETE' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
