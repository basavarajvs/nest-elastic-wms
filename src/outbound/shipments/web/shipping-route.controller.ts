import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { ShippingRouteService } from '../shipping-route.service';
import {
  ShippingRouteDto, ShippingRoutePaginatedResponseDto,
  CreateShippingRouteDto, UpdateShippingRouteDto,
} from '../dtos/response.dto';
import { DeleteResultDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Outbound - Shipping Routes')
@Controller('web/shipping-routes')
export class ShippingRouteWebController {
  constructor(private readonly service: ShippingRouteService) {}

  @Post()
  @ApiOperation({ summary: 'Create shipping route' })
  @ApiCreatedResponse({ type: ShippingRouteDto })
  async create(@Req() req: any, @Body() dto: CreateShippingRouteDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List shipping routes' })
  @ApiOkResponse({ type: ShippingRoutePaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shipping route by ID' })
  @ApiOkResponse({ type: ShippingRouteDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update shipping route' })
  @ApiOkResponse({ type: ShippingRouteDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateShippingRouteDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete shipping route' })
  @ApiOkResponse({ type: DeleteResultDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
