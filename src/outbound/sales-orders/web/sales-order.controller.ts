import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { SalesOrderService } from '../sales-order.service';
import {
  SalesOrderDto, SalesOrderPaginatedResponseDto, SalesOrderDetailDto,
  OrderLineDto, ValidationResultDto, RecalcResultDto,
  CreateSalesOrderDto, UpdateSalesOrderDto, CreateOrderLineDto,
} from '../dtos/response.dto';
import { DeleteResultDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Outbound - Sales Orders')
@Controller('web/sales-orders')
export class SalesOrderWebController {
  constructor(private readonly service: SalesOrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create sales order with lines' })
  @ApiCreatedResponse({ type: SalesOrderDetailDto })
  async create(@Req() req: any, @Body() dto: CreateSalesOrderDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List sales orders' })
  @ApiOkResponse({ type: SalesOrderPaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sales order with lines' })
  @ApiOkResponse({ type: SalesOrderDetailDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update sales order details' })
  @ApiOkResponse({ type: SalesOrderDetailDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateSalesOrderDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, BigInt(id), dto);
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Transition order status (release, cancel, etc.)' })
  @ApiCreatedResponse({ type: SalesOrderDetailDto })
  async transitionStatus(@Req() req: any, @Param('id') id: string, @Body('status') status: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.transitionStatus(tenantId, BigInt(id), status);
  }

  @Post(':id/lines')
  @ApiOperation({ summary: 'Add line to existing order' })
  @ApiCreatedResponse({ type: SalesOrderDetailDto })
  async addLine(@Req() req: any, @Param('id') id: string, @Body() dto: CreateOrderLineDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.addLine(tenantId, BigInt(id), dto);
  }

  @Get(':id/lines')
  @ApiOperation({ summary: 'Get order lines' })
  @ApiOkResponse({ type: [OrderLineDto] })
  async getLines(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.getLines(tenantId, BigInt(id));
  }

  @Post(':id/recalculate')
  @ApiOperation({ summary: 'Recalculate order totals from lines' })
  @ApiCreatedResponse({ type: RecalcResultDto })
  async recalculate(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.recalculateTotals(tenantId, BigInt(id));
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Validate order integrity before release' })
  @ApiCreatedResponse({ type: ValidationResultDto })
  async validate(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.validateOrder(tenantId, BigInt(id));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete sales order' })
  @ApiOkResponse({ type: DeleteResultDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
