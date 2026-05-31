import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { BrandService } from '../brand.service';
import { CreateBrandDto, UpdateBrandDto } from '../dtos/create-brand.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Master-Data')
@Controller('web/brands')
@UseGuards(CaslGuard)
export class BrandWebController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'ProductBrand' })
  async create(@Req() req: any, @Body() dto: CreateBrandDto) {
    return this.brandService.create(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'ProductBrand' })
  async findAll(@Req() req: any) {
    return this.brandService.findAll(req.tenantContext.getTenantId());
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'ProductBrand' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.brandService.findById(id, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'ProductBrand' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.brandService.update(id, req.tenantContext.getTenantId(), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'ProductBrand' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.brandService.delete(id, req.tenantContext.getTenantId());
    return { success: true };
  }
}
