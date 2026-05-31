import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ProductSuppliersService } from '../product-suppliers.service';
import { CreateProductSupplierDto, UpdateProductSupplierDto } from '../dtos/product-supplier.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Products')
@Controller('web/product-suppliers')
@UseGuards(CaslGuard)
export class ProductSuppliersWebController {
  constructor(private readonly service: ProductSuppliersService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'ProductSupplier' })
  @ApiOperation({ summary: 'Create product-supplier mapping' })
  async create(@Req() req: any, @Body() dto: CreateProductSupplierDto) {
    return this.service.create(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'ProductSupplier' })
  @ApiOperation({ summary: 'List product-supplier mappings' })
  async findAll(
    @Req() req: any,
    @Query('productId') productId: string,
    @Query('vendorId') vendorId: string,
  ) {
    return this.service.findAll(req.tenantContext.getTenantId(), productId, vendorId);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'ProductSupplier' })
  @ApiOperation({ summary: 'Get mapping by id' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.service.findById(id, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'ProductSupplier' })
  @ApiOperation({ summary: 'Update mapping' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateProductSupplierDto) {
    return this.service.update(id, req.tenantContext.getTenantId(), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'ProductSupplier' })
  @ApiOperation({ summary: 'Delete mapping' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.service.delete(id, req.tenantContext.getTenantId());
  }
}
