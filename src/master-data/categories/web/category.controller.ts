import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { CategoryService } from '../category.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Master-Data')
@Controller('web/categories')
@UseGuards(CaslGuard)
export class CategoryWebController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'ProductCategory' })
  async create(@Req() req: any, @Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'ProductCategory' })
  async findAll(@Req() req: any) {
    return this.categoryService.findAll(req.tenantContext.getTenantId());
  }

  @Get('tree')
  @CheckAbility({ action: 'read', subject: 'ProductCategory' })
  async getTree(@Req() req: any) {
    return this.categoryService.getCategoryTree(req.tenantContext.getTenantId());
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'ProductCategory' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.categoryService.findById(id, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'ProductCategory' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(id, req.tenantContext.getTenantId(), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'ProductCategory' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.categoryService.delete(id, req.tenantContext.getTenantId());
    return { success: true };
  }
}
