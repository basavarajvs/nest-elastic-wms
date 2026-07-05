import { Controller, Delete, Get, Post, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { ProductSupplierService } from '../product-supplier.service';

@ApiTags('Product Suppliers')
@UseGuards(JwtAuthGuard, CaslGuard)
@Controller('web/product-suppliers')
export class ProductSupplierController {
  constructor(private readonly productSupplierService: ProductSupplierService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'Product' })
  @ApiOperation({ summary: 'Create product-supplier assignment' })
  async create(@Req() req: any, @Body() dto: any) {
    return this.productSupplierService.create(req.tenantContext.getTenantId(), dto);
  }

  @Get()
  @CheckAbility({ action: 'list', subject: 'Product' })
  @ApiOperation({ summary: 'List product-supplier assignments' })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.productSupplierService.findAll(req.tenantContext.getTenantId(), query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Product' })
  @ApiOperation({ summary: 'Get product-supplier assignment' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.productSupplierService.findById(req.tenantContext.getTenantId(), BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Product' })
  @ApiOperation({ summary: 'Update product-supplier assignment' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.productSupplierService.update(req.tenantContext.getTenantId(), BigInt(id), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Product' })
  @ApiOperation({ summary: 'Delete product-supplier assignment' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.productSupplierService.delete(req.tenantContext.getTenantId(), BigInt(id));
  }
}
