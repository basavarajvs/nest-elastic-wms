import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { ShippingLabelService } from '../shipping-label.service';
import {
  ShippingLabelDto, ShippingLabelPaginatedResponseDto,
  CreateShippingLabelDto, UpdateShippingLabelDto,
} from '../dtos/response.dto';
import { DeleteResultDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Outbound - Shipping Labels')
@Controller('web/shipping-labels')
export class ShippingLabelWebController {
  constructor(private readonly service: ShippingLabelService) {}

  @Post()
  @ApiOperation({ summary: 'Create shipping label' })
  @ApiCreatedResponse({ type: ShippingLabelDto })
  async create(@Req() req: any, @Body() dto: CreateShippingLabelDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List shipping labels' })
  @ApiOkResponse({ type: ShippingLabelPaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shipping label by ID' })
  @ApiOkResponse({ type: ShippingLabelDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update shipping label' })
  @ApiOkResponse({ type: ShippingLabelDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateShippingLabelDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete shipping label' })
  @ApiOkResponse({ type: DeleteResultDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
