import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../../common/decorators/audit-log.decorator';
import { CarrierRateService } from '../carrier-rate.service';

@ApiTags('Outbound - Carrier Rates')
@Controller('web/carrier-rates')
@UseGuards(JwtAuthGuard, CaslGuard)
export class CarrierRateWebController {
  constructor(private readonly service: CarrierRateService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'CarrierRate' })
  @AuditLog({ eventType: 'CARRIER_RATE_CREATED', detail: (req, body) => `Created carrier rate for ${body.carrierCode}` })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'CarrierRate' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'CarrierRate' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'CarrierRate' })
  @AuditLog({ eventType: 'CARRIER_RATE_UPDATED', detail: (req) => `Updated carrier rate ${req.params.id}` })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'CarrierRate' })
  @AuditLog({ eventType: 'CARRIER_RATE_DELETED', detail: (req) => `Deleted carrier rate ${req.params.id}` })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }

  @Post('shop')
  @CheckAbility({ action: 'read', subject: 'CarrierRate' })
  @ApiOperation({ summary: 'Shop for cheapest and fastest carrier rates' })
  async shop(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.shop(tenantId, dto.zones, dto.weight, dto.serviceLevel);
  }
}
