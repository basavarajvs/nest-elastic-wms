import { Controller, Delete, Get, Post, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { ProductPackagingService } from '../product-packaging.service';
import { ProductPackagingResponseDto, CreateProductPackagingDto, UpdateProductPackagingDto } from '../dtos/product-packaging-response.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Product Packaging')
@UseGuards(JwtAuthGuard, CaslGuard)
@Controller('web/product-packaging')
export class ProductPackagingController {
  constructor(private readonly productPackagingService: ProductPackagingService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'Product' })
  @ApiOperation({ summary: 'Create product packaging hierarchy' })
  @ApiCreatedResponse({ type: ProductPackagingResponseDto })
  async create(@Req() req: any, @Body() dto: CreateProductPackagingDto) {
    return this.productPackagingService.create(req.tenantContext.getTenantId(), dto);
  }

  @Get()
  @CheckAbility({ action: 'list', subject: 'Product' })
  @ApiOperation({ summary: 'List product packaging hierarchy' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.productPackagingService.findAll(req.tenantContext.getTenantId(), query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Product' })
  @ApiOperation({ summary: 'Get product packaging hierarchy' })
  @ApiOkResponse({ type: ProductPackagingResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.productPackagingService.findById(req.tenantContext.getTenantId(), BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Product' })
  @ApiOperation({ summary: 'Update product packaging hierarchy' })
  @ApiOkResponse({ type: ProductPackagingResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateProductPackagingDto) {
    return this.productPackagingService.update(req.tenantContext.getTenantId(), BigInt(id), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Product' })
  @ApiOperation({ summary: 'Delete product packaging hierarchy' })
  @ApiOkResponse({ type: ProductPackagingResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.productPackagingService.delete(req.tenantContext.getTenantId(), BigInt(id));
  }
}
