import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { ProductAttributeService } from '../product-attribute.service';
import { ProductAttributeResponseDto, CreateProductAttributeDto, UpdateProductAttributeDto } from '../dtos/product-attribute-response.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Product Attributes')
@UseGuards(JwtAuthGuard, CaslGuard)
@Controller('web/product-attributes')
export class ProductAttributeController {
  constructor(private readonly productAttributeService: ProductAttributeService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'ProductAttribute' })
  @ApiOperation({ summary: 'Create product attribute' })
  @ApiCreatedResponse({ type: ProductAttributeResponseDto })
  async create(@Req() req: any, @Body() dto: CreateProductAttributeDto) {
    return this.productAttributeService.create(req.tenantContext.getTenantId(), dto);
  }

  @Get()
  @CheckAbility({ action: 'list', subject: 'ProductAttribute' })
  @ApiOperation({ summary: 'List product attributes' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.productAttributeService.findAll(req.tenantContext.getTenantId(), query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'ProductAttribute' })
  @ApiOperation({ summary: 'Get product attribute' })
  @ApiOkResponse({ type: ProductAttributeResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.productAttributeService.findById(req.tenantContext.getTenantId(), BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'ProductAttribute' })
  @ApiOperation({ summary: 'Update product attribute' })
  @ApiOkResponse({ type: ProductAttributeResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateProductAttributeDto) {
    return this.productAttributeService.update(req.tenantContext.getTenantId(), BigInt(id), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'ProductAttribute' })
  @ApiOperation({ summary: 'Delete product attribute' })
  @ApiOkResponse({ type: ProductAttributeResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.productAttributeService.delete(req.tenantContext.getTenantId(), BigInt(id));
  }
}
