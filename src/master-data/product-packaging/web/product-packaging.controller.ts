import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ProductPackagingService } from '../product-packaging.service';
import { CreatePackagingDto, UpdatePackagingDto } from '../dtos/packaging.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Products')
@Controller('web/product-packaging')
@UseGuards(CaslGuard)
export class ProductPackagingWebController {
  constructor(private readonly service: ProductPackagingService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'ProductPackagingHierarchy' })
  @ApiOperation({ summary: 'Create packaging hierarchy entry' })
  async create(@Req() req: any, @Body() dto: CreatePackagingDto) {
    return this.service.create(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'ProductPackagingHierarchy' })
  @ApiOperation({ summary: 'List packaging entries' })
  async findAll(@Req() req: any, @Query('productId') productId: string) {
    return this.service.findAll(req.tenantContext.getTenantId(), productId);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'ProductPackagingHierarchy' })
  @ApiOperation({ summary: 'Get packaging by id' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.service.findByProduct(id, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'ProductPackagingHierarchy' })
  @ApiOperation({ summary: 'Update packaging entry' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdatePackagingDto) {
    return this.service.update(id, req.tenantContext.getTenantId(), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'ProductPackagingHierarchy' })
  @ApiOperation({ summary: 'Delete packaging entry' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.service.delete(id, req.tenantContext.getTenantId());
  }

  @Get('/convert')
  @ApiOperation({ summary: 'Convert quantity between UOMs using packaging hierarchy' })
  async convert(
    @Req() req: any,
    @Query('productId') productId: string,
    @Query('fromUomId') fromUomId: string,
    @Query('toUomId') toUomId: string,
    @Query('quantity') quantity: string,
  ) {
    return this.service.convert(fromUomId, toUomId, productId, parseFloat(quantity), req.tenantContext.getTenantId());
  }
}
