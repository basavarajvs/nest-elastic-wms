import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { ProductAttributeService } from '../product-attribute.service';

@ApiTags('Product Attributes')
@UseGuards(JwtAuthGuard, CaslGuard)
@Controller('web/product-attributes')
export class ProductAttributeController {
  constructor(private readonly productAttributeService: ProductAttributeService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'ProductAttribute' })
  @ApiOperation({ summary: 'Create product attribute' })
  async create(@Req() req: any, @Body() dto: any) {
    return this.productAttributeService.create(req.tenantContext.getTenantId(), dto);
  }

  @Get()
  @CheckAbility({ action: 'list', subject: 'ProductAttribute' })
  @ApiOperation({ summary: 'List product attributes' })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.productAttributeService.findAll(req.tenantContext.getTenantId(), query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'ProductAttribute' })
  @ApiOperation({ summary: 'Get product attribute' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.productAttributeService.findById(req.tenantContext.getTenantId(), BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'ProductAttribute' })
  @ApiOperation({ summary: 'Update product attribute' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.productAttributeService.update(req.tenantContext.getTenantId(), BigInt(id), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'ProductAttribute' })
  @ApiOperation({ summary: 'Delete product attribute' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.productAttributeService.delete(req.tenantContext.getTenantId(), BigInt(id));
  }
}
