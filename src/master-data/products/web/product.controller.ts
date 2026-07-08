import { Controller, Delete, Get, Post, Patch, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { ProductService } from '../product.service';
import { ProductResponseDto, CreateProductDto, UpdateProductDto } from '../dtos/product-response.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Products')
@Controller('web/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create product' })
  @ApiCreatedResponse({ type: ProductResponseDto })
  async create(@Req() req: any, @Body() dto: CreateProductDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.productService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List products' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.productService.findAll(tenantId, query);
  }

  @Get('lookup')
  @ApiOperation({ summary: 'Lightweight product lookup for dropdown filters' })
  @ApiOkResponse({ type: Object })
  async lookup(@Req() req: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.productService.findLookup(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full product with barcodes, suppliers, packaging' })
  @ApiOkResponse({ type: ProductResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.productService.getFullProduct(tenantId, BigInt(id));
  }

  @Get('barcode/:code')
  @ApiOperation({ summary: 'Lookup product by barcode' })
  @ApiOkResponse({ type: ProductResponseDto })
  async findByBarcode(@Req() req: any, @Param('code') code: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.productService.findByBarcode(tenantId, code);
  }

  @Post('barcode/:code')
  @ApiOperation({ summary: 'Lookup product by barcode (POST)' })
  @ApiOkResponse({ type: ProductResponseDto })
  async lookupByBarcode(@Req() req: any, @Param('code') code: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.productService.findByBarcode(tenantId, code);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiOkResponse({ type: ProductResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.productService.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  @ApiOkResponse({ type: ProductResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.productService.delete(tenantId, BigInt(id));
  }
}
