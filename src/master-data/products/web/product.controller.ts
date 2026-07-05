import { Controller, Delete, Get, Post, Patch, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductService } from '../product.service';

@ApiTags('Products')
@Controller('web/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create product' })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.productService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List products' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.productService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full product with barcodes, suppliers, packaging' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.productService.getFullProduct(tenantId, BigInt(id));
  }

  @Get('barcode/:code')
  @ApiOperation({ summary: 'Lookup product by barcode' })
  async findByBarcode(@Req() req: any, @Param('code') code: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.productService.findByBarcode(tenantId, code);
  }

  @Post('barcode/:code')
  @ApiOperation({ summary: 'Lookup product by barcode (POST)' })
  async lookupByBarcode(@Req() req: any, @Param('code') code: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.productService.findByBarcode(tenantId, code);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.productService.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.productService.delete(tenantId, BigInt(id));
  }
}
