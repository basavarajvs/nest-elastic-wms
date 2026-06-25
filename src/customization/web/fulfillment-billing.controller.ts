import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { FulfillmentBillingService } from '../billing/fulfillment-billing.service';

class CreateBillingRunDto {
  facilityId: string;
  runType: string;
  periodStart: string;
  periodEnd: string;
}

class ListBillingRunsDto {
  facilityId?: string;
  status?: string;
  runType?: string;
  limit?: number;
  offset?: number;
}

@ApiTags('WMS-WEB', 'Fulfillment-Billing')
@Controller('web/fulfillment-billing/runs')
@UseGuards(CaslGuard)
export class FulfillmentBillingController {
  constructor(
    private readonly billingService: FulfillmentBillingService,
  ) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'FulfillmentBillingRun' })
  @ApiOperation({ summary: 'Create billing run' })
  async create(@Body() dto: CreateBillingRunDto, @Req() req: any) {
    return this.billingService.createRun({
      tenantId: req.tenantContext.getTenantId(),
      facilityId: dto.facilityId,
      runType: dto.runType,
      periodStart: dto.periodStart,
      periodEnd: dto.periodEnd,
    });
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'FulfillmentBillingRun' })
  @ApiOperation({ summary: 'List billing runs' })
  async findAll(@Req() req: any, @Query() query: ListBillingRunsDto) {
    return this.billingService.findAll(req.tenantContext.getTenantId(), query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'FulfillmentBillingRun' })
  @ApiOperation({ summary: 'Run detail with events' })
  async findById(@Param('id') id: string, @Req() req: any) {
    return this.billingService.findById(id, req.tenantContext.getTenantId());
  }
}
