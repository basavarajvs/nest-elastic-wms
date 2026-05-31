import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ShippingLabelsService } from '../shipping-labels.service';
import { GenerateLabelDto, PrintLabelDto } from '../dtos/shipping-label.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Outbound')
@Controller('web/shipping-labels')
@UseGuards(CaslGuard)
export class ShippingLabelsWebController {
  constructor(private readonly service: ShippingLabelsService) {}

  @Post('/generate')
  @CheckAbility({ action: 'create', subject: 'ShippingLabel' })
  @ApiOperation({ summary: 'Generate shipping label' })
  async generate(@Req() req: any, @Body() dto: GenerateLabelDto) {
    return this.service.generate(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'ShippingLabel' })
  @ApiOperation({ summary: 'List shipping labels' })
  async findAll(
    @Req() req: any,
    @Query('shipmentId') shipmentId: string,
  ) {
    return this.service.findAll(req.tenantContext.getTenantId(), shipmentId);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'ShippingLabel' })
  @ApiOperation({ summary: 'Get label by id' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.service.findById(id, req.tenantContext.getTenantId());
  }

  @Get(':id/pdf')
  @CheckAbility({ action: 'read', subject: 'ShippingLabel' })
  @ApiOperation({ summary: 'Get label PDF download info' })
  async getPdf(@Req() req: any, @Param('id') id: string) {
    return this.service.getPdfDownload(id, req.tenantContext.getTenantId());
  }

  @Post('webhooks/tracking')
  @ApiOperation({ summary: 'Tracking update webhook' })
  async trackingWebhook(@Req() req: any, @Body() body: { trackingNumber: string; status: string; carrierCode?: string }) {
    return this.service.handleTrackingWebhook(body, req.tenantContext.getTenantId());
  }

  @Post(':id/print')
  @CheckAbility({ action: 'update', subject: 'ShippingLabel' })
  @ApiOperation({ summary: 'Print label' })
  async print(@Req() req: any, @Param('id') id: string, @Body() dto: PrintLabelDto) {
    return this.service.print(id, dto.copies, req.tenantContext.getTenantId());
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'ShippingLabel' })
  @ApiOperation({ summary: 'Delete label' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.service.delete(id, req.tenantContext.getTenantId());
  }
}
