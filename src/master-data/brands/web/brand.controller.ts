import { Controller, Delete, Get, Post, Patch, Param, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BrandService } from '../brand.service';

@ApiTags('Product Brands')
@Controller('web/product-brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post() @ApiOperation({ summary: 'Create brand' })
  async create(@Req() req: any, @Body() dto: any) {
    return this.brandService.create(req.tenantContext.getTenantId(), dto);
  }
  @Get() @ApiOperation({ summary: 'List brands' })
  async findAll(@Req() req: any) {
    return this.brandService.findAll(req.tenantContext.getTenantId());
  }
  @Get(':id') @ApiOperation({ summary: 'Get brand' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.brandService.findById(req.tenantContext.getTenantId(), BigInt(id));
  }
  @Patch(':id') @ApiOperation({ summary: 'Update brand' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.brandService.update(req.tenantContext.getTenantId(), BigInt(id), dto);
  }
  @Delete(':id') @ApiOperation({ summary: 'Delete brand' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.brandService.delete(req.tenantContext.getTenantId(), BigInt(id));
  }
}
