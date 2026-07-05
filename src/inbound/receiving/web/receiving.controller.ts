import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReceivingService } from '../receiving.service';

@ApiTags('Goods Receipt')
@Controller('web/goods-receipts')
export class ReceivingController {
  constructor(private readonly receivingService: ReceivingService) {}

  @Post()
  @ApiOperation({ summary: 'Create goods receipt' })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.createReceipt(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List goods receipts' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.findAllReceipts(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get goods receipt with lines' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.findReceiptById(tenantId, BigInt(id));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete goods receipt' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.delete(tenantId, BigInt(id));
  }

  @Post(':id/receive-line')
  @ApiOperation({ summary: 'Receive a line item' })
  async receiveLine(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.receiveLine(tenantId, BigInt(id), dto);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete goods receipt' })
  async complete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.completeReceipt(tenantId, BigInt(id));
  }
}
