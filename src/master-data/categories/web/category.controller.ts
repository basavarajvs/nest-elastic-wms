import { Controller, Delete, Get, Post, Patch, Param, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { CategoryService } from '../category.service';
import { CategoryResponseDto, CreateCategoryDto, UpdateCategoryDto } from '../dtos/category-response.dto';

@ApiTags('Product Categories')
@Controller('web/product-categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post() @ApiOperation({ summary: 'Create category' })
  @ApiCreatedResponse({ type: CategoryResponseDto })
  async create(@Req() req: any, @Body() dto: CreateCategoryDto) {
    return this.categoryService.create(req.tenantContext.getTenantId(), dto);
  }
  @Get() @ApiOperation({ summary: 'List categories with tree' })
  @ApiOkResponse({ type: CategoryResponseDto, isArray: true })
  async findAll(@Req() req: any) {
    return this.categoryService.findAll(req.tenantContext.getTenantId());
  }
  @Get(':id') @ApiOperation({ summary: 'Get category with children' })
  @ApiOkResponse({ type: CategoryResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.categoryService.findById(req.tenantContext.getTenantId(), BigInt(id));
  }
  @Patch(':id') @ApiOperation({ summary: 'Update category' })
  @ApiOkResponse({ type: CategoryResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(req.tenantContext.getTenantId(), BigInt(id), dto);
  }
  @Delete(':id') @ApiOperation({ summary: 'Delete category' })
  @ApiOkResponse({ type: CategoryResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.categoryService.delete(req.tenantContext.getTenantId(), BigInt(id));
  }
}
