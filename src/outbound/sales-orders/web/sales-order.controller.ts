import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SalesOrderService } from '../sales-order.service';

@ApiTags('Outbound - Sales Orders')
@Controller('web/sales-orders')
export class SalesOrderWebController {
  constructor(private readonly service: SalesOrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create sales order with lines' })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List sales orders' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sales order with lines' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update sales order details' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, BigInt(id), dto);
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Transition order status (release, cancel, etc.)' })
  async transitionStatus(@Req() req: any, @Param('id') id: string, @Body('status') status: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.transitionStatus(tenantId, BigInt(id), status);
  }

  @Post(':id/lines')
  @ApiOperation({ summary: 'Add line to existing order' })
  async addLine(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.addLine(tenantId, BigInt(id), dto);
  }

  @Get(':id/lines')
  @ApiOperation({ summary: 'Get order lines' })
  async getLines(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.getLines(tenantId, BigInt(id));
  }

  @Post(':id/recalculate')
  @ApiOperation({ summary: 'Recalculate order totals from lines' })
  async recalculate(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.recalculateTotals(tenantId, BigInt(id));
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Validate order integrity before release' })
  async validate(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.validateOrder(tenantId, BigInt(id));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete sales order' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
