import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { ReceivingService } from '../receiving.service';
import { GoodsReceiptResponseDto, GoodsReceiptWithLinesResponseDto, PaginatedGoodsReceiptResponseDto, ReceiveLineResponseDto, CreateGoodsReceiptDto, ReceiveLineDto } from '../dtos/receiving-response.dto';

@ApiTags('Goods Receipt')
@Controller('web/goods-receipts')
export class ReceivingController {
  constructor(private readonly receivingService: ReceivingService) {}

  @Post()
  @ApiOperation({ summary: 'Create goods receipt' })
  @ApiCreatedResponse({ type: GoodsReceiptResponseDto })
  async create(@Req() req: any, @Body() dto: CreateGoodsReceiptDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.createReceipt(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List goods receipts' })
  @ApiOkResponse({ type: PaginatedGoodsReceiptResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.findAllReceipts(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get goods receipt with lines' })
  @ApiOkResponse({ type: GoodsReceiptWithLinesResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.findReceiptById(tenantId, BigInt(id));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete goods receipt' })
  @ApiOkResponse({ type: GoodsReceiptResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.delete(tenantId, BigInt(id));
  }

  @Post(':id/receive-line')
  @ApiOperation({ summary: 'Receive a line item' })
  @ApiCreatedResponse({ type: ReceiveLineResponseDto })
  async receiveLine(@Req() req: any, @Param('id') id: string, @Body() dto: ReceiveLineDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.receiveLine(tenantId, BigInt(id), dto);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete goods receipt' })
  @ApiOkResponse({ type: GoodsReceiptWithLinesResponseDto })
  async complete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.receivingService.completeReceipt(tenantId, BigInt(id));
  }
}
