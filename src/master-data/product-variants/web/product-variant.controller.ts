import { Controller, Delete, Get, Post, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { ProductVariantService } from '../product-variant.service';
import { ProductVariantResponseDto, CreateProductVariantDto, UpdateProductVariantDto } from '../dtos/product-variant-response.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Product Variants')
@UseGuards(JwtAuthGuard, CaslGuard)
@Controller('web/product-variants')
export class ProductVariantController {
  constructor(private readonly productVariantService: ProductVariantService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'Product' })
  @ApiOperation({ summary: 'Create product variant' })
  @ApiCreatedResponse({ type: ProductVariantResponseDto })
  async create(@Req() req: any, @Body() dto: CreateProductVariantDto) {
    return this.productVariantService.create(req.tenantContext.getTenantId(), dto);
  }

  @Get()
  @CheckAbility({ action: 'list', subject: 'Product' })
  @ApiOperation({ summary: 'List product variants' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.productVariantService.findAll(req.tenantContext.getTenantId(), query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Product' })
  @ApiOperation({ summary: 'Get product variant' })
  @ApiOkResponse({ type: ProductVariantResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.productVariantService.findById(req.tenantContext.getTenantId(), BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Product' })
  @ApiOperation({ summary: 'Update product variant' })
  @ApiOkResponse({ type: ProductVariantResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateProductVariantDto) {
    return this.productVariantService.update(req.tenantContext.getTenantId(), BigInt(id), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Product' })
  @ApiOperation({ summary: 'Delete product variant' })
  @ApiOkResponse({ type: ProductVariantResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.productVariantService.delete(req.tenantContext.getTenantId(), BigInt(id));
  }
}
