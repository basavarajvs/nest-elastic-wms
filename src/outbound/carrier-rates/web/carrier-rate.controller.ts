import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../../common/decorators/audit-log.decorator';
import { CarrierRateService } from '../carrier-rate.service';
import { CarrierRateDto, CarrierRatePaginatedResponseDto, ShopResultDto, CreateCarrierRateDto, UpdateCarrierRateDto, ShopRatesDto } from '../dtos/response.dto';
import { DeleteResultDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Outbound - Carrier Rates')
@Controller('web/carrier-rates')
@UseGuards(JwtAuthGuard, CaslGuard)
export class CarrierRateWebController {
  constructor(private readonly service: CarrierRateService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'CarrierRate' })
  @AuditLog({ eventType: 'CARRIER_RATE_CREATED', detail: (req, body) => `Created carrier rate for ${body.carrierCode}` })
  @ApiCreatedResponse({ type: CarrierRateDto })
  async create(@Req() req: any, @Body() dto: CreateCarrierRateDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'CarrierRate' })
  @ApiOkResponse({ type: CarrierRatePaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'CarrierRate' })
  @ApiOkResponse({ type: CarrierRateDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'CarrierRate' })
  @AuditLog({ eventType: 'CARRIER_RATE_UPDATED', detail: (req) => `Updated carrier rate ${req.params.id}` })
  @ApiOkResponse({ type: CarrierRateDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCarrierRateDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'CarrierRate' })
  @AuditLog({ eventType: 'CARRIER_RATE_DELETED', detail: (req) => `Deleted carrier rate ${req.params.id}` })
  @ApiOkResponse({ type: DeleteResultDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }

  @Post('shop')
  @CheckAbility({ action: 'read', subject: 'CarrierRate' })
  @ApiOperation({ summary: 'Shop for cheapest and fastest carrier rates' })
  @ApiCreatedResponse({ type: ShopResultDto })
  async shop(@Req() req: any, @Body() dto: ShopRatesDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.shop(tenantId, dto.zones, dto.weight, dto.service_level);
  }
}
