import { Controller, Delete, Get, Post, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { ProductVariantService } from '../product-variant.service';

@ApiTags('Product Variants')
@UseGuards(JwtAuthGuard, CaslGuard)
@Controller('web/product-variants')
export class ProductVariantController {
  constructor(private readonly productVariantService: ProductVariantService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'Product' })
  @ApiOperation({ summary: 'Create product variant' })
  async create(@Req() req: any, @Body() dto: any) {
    return this.productVariantService.create(req.tenantContext.getTenantId(), dto);
  }

  @Get()
  @CheckAbility({ action: 'list', subject: 'Product' })
  @ApiOperation({ summary: 'List product variants' })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.productVariantService.findAll(req.tenantContext.getTenantId(), query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Product' })
  @ApiOperation({ summary: 'Get product variant' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.productVariantService.findById(req.tenantContext.getTenantId(), BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Product' })
  @ApiOperation({ summary: 'Update product variant' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.productVariantService.update(req.tenantContext.getTenantId(), BigInt(id), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Product' })
  @ApiOperation({ summary: 'Delete product variant' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.productVariantService.delete(req.tenantContext.getTenantId(), BigInt(id));
  }
}
