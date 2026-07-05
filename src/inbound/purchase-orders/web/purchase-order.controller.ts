import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PurchaseOrderService } from '../purchase-order.service';

@ApiTags('Purchase Orders')
@Controller('web/purchase-orders')
export class PurchaseOrderController {
  constructor(private readonly poService: PurchaseOrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create purchase order with lines' })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.poService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List purchase orders' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.poService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase order' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.poService.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update purchase order' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.poService.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete purchase order' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.poService.delete(tenantId, BigInt(id));
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve purchase order' })
  async approve(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub || req.user?.userId;
    return this.poService.approve(tenantId, BigInt(id), userId);
  }

  @Get(':id/lines')
  @ApiOperation({ summary: 'Get purchase order lines' })
  async findLines(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.poService.findLines(tenantId, BigInt(id));
  }

  @Patch(':id/lines/:lineId/status')
  @ApiOperation({ summary: 'Update line status' })
  async updateLineStatus(
    @Req() req: any,
    @Param('id') _id: string,
    @Param('lineId') lineId: string,
    @Body('status') status: string,
  ) {
    const tenantId = req.tenantContext.getTenantId();
    return this.poService.updateLineStatus(tenantId, BigInt(lineId), status);
  }
}
