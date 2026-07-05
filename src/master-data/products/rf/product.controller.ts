import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { ProductService } from '../product.service';

@ApiTags('WMS-RF')
@Controller('rf/products')
export class RfProductController {
  constructor(private readonly productService: ProductService) {}

  @Post('lookup')
  @ApiOperation({ summary: 'RF: Scan product barcode' })
  @RfAction('read')
  async lookup(@Req() req: any, @Body() dto: { barcode: string }) {
    const tenantId = req.tenantContext.getTenantId();
    return this.productService.rfLookup(tenantId, dto.barcode);
  }
}
