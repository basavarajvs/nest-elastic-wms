import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ProductService, ProductProjection } from '../product.service';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { RfAction } from '../../common/guards/rf-action.decorator';
import { RfActionLightweightGuard } from '../../common/guards/rf-action-lightweight.guard';

@Controller('rf/products')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class ProductsRfController {
  constructor(private readonly productService: ProductService) {}

  @Get('barcode/:code')
  @RfAction('read')
  async findByBarcode(@Req() req: any, @Param('code') code: string) {
    return this.productService.findByBarcode(code, req.tenantContext.getTenantId());
  }

  @Get(':id')
  @RfAction('read')
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.productService.findById(id, req.tenantContext.getTenantId(), ProductProjection.RF);
  }
}
