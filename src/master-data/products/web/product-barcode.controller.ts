import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { CreateProductBarcodeDto, UpdateProductBarcodeDto, ProductBarcodeResponseDto } from '../dtos/product-response.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { ProductBarcodeService } from '../product-barcode.service';

@ApiTags('Product Barcodes')
@Controller('web/product-barcodes')
export class ProductBarcodeController {
  constructor(private readonly service: ProductBarcodeService) {}

  @Post()
  @ApiOperation({ summary: 'Create product barcode' })
  @ApiCreatedResponse({ type: ProductBarcodeResponseDto })
  async create(@Req() req: any, @Body() dto: CreateProductBarcodeDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List product barcodes' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product barcode' })
  @ApiOkResponse({ type: ProductBarcodeResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product barcode' })
  @ApiOkResponse({ type: ProductBarcodeResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateProductBarcodeDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product barcode' })
  @ApiOkResponse({ type: ProductBarcodeResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
