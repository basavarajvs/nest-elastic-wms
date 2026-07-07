import { Controller, Delete, Get, Post, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { ProductVelocityService } from '../product-velocity.service';
import { ProductVelocityResponseDto, CreateProductVelocityDto, UpdateProductVelocityDto } from '../dtos/product-velocity-response.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Product Velocity')
@UseGuards(JwtAuthGuard, CaslGuard)
@Controller('web/product-velocity')
export class ProductVelocityController {
  constructor(private readonly productVelocityService: ProductVelocityService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'Product' })
  @ApiOperation({ summary: 'Create product velocity classification' })
  @ApiCreatedResponse({ type: ProductVelocityResponseDto })
  async create(@Req() req: any, @Body() dto: CreateProductVelocityDto) {
    return this.productVelocityService.create(req.tenantContext.getTenantId(), dto);
  }

  @Get()
  @CheckAbility({ action: 'list', subject: 'Product' })
  @ApiOperation({ summary: 'List product velocity classifications' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.productVelocityService.findAll(req.tenantContext.getTenantId(), query);
  }

  @Get('by-product/:productId')
  @CheckAbility({ action: 'read', subject: 'Product' })
  @ApiOperation({ summary: 'Find velocity by product' })
  @ApiOkResponse({ type: ProductVelocityResponseDto, isArray: true })
  async findByProduct(@Req() req: any, @Param('productId') productId: string, @Query('facilityId') facilityId?: string) {
    return this.productVelocityService.findByProduct(
      req.tenantContext.getTenantId(),
      BigInt(productId),
      facilityId ? BigInt(facilityId) : undefined,
    );
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Product' })
  @ApiOperation({ summary: 'Get product velocity classification' })
  @ApiOkResponse({ type: ProductVelocityResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.productVelocityService.findById(req.tenantContext.getTenantId(), BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Product' })
  @ApiOperation({ summary: 'Update product velocity classification' })
  @ApiOkResponse({ type: ProductVelocityResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateProductVelocityDto) {
    return this.productVelocityService.update(req.tenantContext.getTenantId(), BigInt(id), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Product' })
  @ApiOperation({ summary: 'Delete product velocity classification' })
  @ApiOkResponse({ type: ProductVelocityResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.productVelocityService.delete(req.tenantContext.getTenantId(), BigInt(id));
  }
}
