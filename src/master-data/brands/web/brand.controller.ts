import { Controller, Delete, Get, Post, Patch, Param, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { BrandService } from '../brand.service';
import { BrandResponseDto, CreateBrandDto, UpdateBrandDto } from '../dtos/brand-response.dto';

@ApiTags('Product Brands')
@Controller('web/product-brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post() @ApiOperation({ summary: 'Create brand' })
  @ApiCreatedResponse({ type: BrandResponseDto })
  async create(@Req() req: any, @Body() dto: CreateBrandDto) {
    return this.brandService.create(req.tenantContext.getTenantId(), dto);
  }
  @Get() @ApiOperation({ summary: 'List brands' })
  @ApiOkResponse({ type: BrandResponseDto, isArray: true })
  async findAll(@Req() req: any) {
    return this.brandService.findAll(req.tenantContext.getTenantId());
  }
  @Get(':id') @ApiOperation({ summary: 'Get brand' })
  @ApiOkResponse({ type: BrandResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.brandService.findById(req.tenantContext.getTenantId(), BigInt(id));
  }
  @Patch(':id') @ApiOperation({ summary: 'Update brand' })
  @ApiOkResponse({ type: BrandResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.brandService.update(req.tenantContext.getTenantId(), BigInt(id), dto);
  }
  @Delete(':id') @ApiOperation({ summary: 'Delete brand' })
  @ApiOkResponse({ type: BrandResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.brandService.delete(req.tenantContext.getTenantId(), BigInt(id));
  }
}
