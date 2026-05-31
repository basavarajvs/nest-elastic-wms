import { Controller, Get, Post, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CarrierRateShoppingService } from '../carrier-rate-shopping.service';
import { CreateCarrierRateDto, RateQuoteRequestDto, CompareRatesDto } from '../dtos/carrier-rate.dto';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/carrier-rates')
@UseGuards(CaslGuard)
export class CarrierRateShoppingWebController {
  constructor(private readonly service: CarrierRateShoppingService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'CarrierRate' })
  @ApiOperation({ summary: 'Create a carrier rate' })
  async createRate(@Body() dto: CreateCarrierRateDto, @Req() req: any) {
    return this.service.createRate(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'CarrierRate' })
  @ApiOperation({ summary: 'List carrier rates' })
  async findRates(@Req() req: any, @Query('carrierId') carrierId: string) {
    return this.service.findRates(req.tenantContext.getTenantId(), carrierId);
  }

  @Post('/quote')
  @CheckAbility({ action: 'read', subject: 'CarrierRate' })
  @ApiOperation({ summary: 'Get rate quote from a carrier' })
  async getQuote(@Body() dto: RateQuoteRequestDto, @Req() req: any) {
    return this.service.getQuote(dto, req.tenantContext.getTenantId());
  }

  @Post('/compare')
  @CheckAbility({ action: 'read', subject: 'CarrierRate' })
  @ApiOperation({ summary: 'Compare rates across carriers' })
  async compareRates(@Body() dto: CompareRatesDto, @Req() req: any) {
    return this.service.compareRates(dto, req.tenantContext.getTenantId());
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'CarrierRate' })
  @ApiOperation({ summary: 'Delete a carrier rate' })
  async deleteRate(@Param('id') id: string, @Req() req: any) {
    await this.service.deleteRate(id, req.tenantContext.getTenantId());
    return { deleted: true };
  }
}
