import { Controller, Delete, Get, Post, Patch, Param, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CategoryService } from '../category.service';

@ApiTags('Product Categories')
@Controller('web/product-categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post() @ApiOperation({ summary: 'Create category' })
  async create(@Req() req: any, @Body() dto: any) {
    return this.categoryService.create(req.tenantContext.getTenantId(), dto);
  }
  @Get() @ApiOperation({ summary: 'List categories with tree' })
  async findAll(@Req() req: any) {
    return this.categoryService.findAll(req.tenantContext.getTenantId());
  }
  @Get(':id') @ApiOperation({ summary: 'Get category with children' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.categoryService.findById(req.tenantContext.getTenantId(), BigInt(id));
  }
  @Patch(':id') @ApiOperation({ summary: 'Update category' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.categoryService.update(req.tenantContext.getTenantId(), BigInt(id), dto);
  }
  @Delete(':id') @ApiOperation({ summary: 'Delete category' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.categoryService.delete(req.tenantContext.getTenantId(), BigInt(id));
  }
}
