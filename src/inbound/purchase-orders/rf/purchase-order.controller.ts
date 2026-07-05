import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { PurchaseOrderService } from '../purchase-order.service';

@ApiTags('RF - Purchase Orders')
@Controller('rf/purchase-orders')
export class RfPurchaseOrderController {
  constructor(private readonly poService: PurchaseOrderService) {}

  @Post('lookup')
  @ApiOperation({ summary: 'Lookup PO by number (RF)' })
  @RfAction('read')
  async lookup(@Req() req: any, @Body('poNumber') poNumber: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.poService.findAll(tenantId, { search: poNumber, limit: 5 });
  }
}
