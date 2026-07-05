import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { PurchaseOrderService } from '../purchase-order.service';

@ApiTags('RF - Purchase Orders')
@Controller('rf/purchase-orders')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class RfPurchaseOrderController {
  constructor(private readonly poService: PurchaseOrderService) {}

  @Post('lookup')
  @ApiOperation({ summary: 'Lookup PO by number (RF) with line items' })
  @RfAction('read')
  async lookup(@Req() req: any, @Body('poNumber') poNumber: string) {
    const tenantId = req.tenantContext.getTenantId();
    const result = await this.poService.findAll(tenantId, { search: poNumber, limit: 5 });
    if (result?.data?.[0]) {
      const po = result.data[0];
      const lines = await this.poService['prisma'].purchase_order_lines.findMany({
        where: { tenant_id: tenantId, po_id: po.po_id },
      });
      return { ...result, lines };
    }
    return result;
  }

  @Post('start-receiving')
  @ApiOperation({ summary: 'Initiate PO-based receiving session (RF)' })
  @RfAction('create')
  async startReceiving(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const po = await this.poService.findAll(tenantId, { search: dto.poNumber, limit: 1 });
    if (!po?.data?.[0]) {
      return { error: 'PO not found' };
    }
    const lines = await this.poService['prisma'].purchase_order_lines.findMany({
      where: { tenant_id: tenantId, po_id: po.data[0].po_id },
    });
    return { po: po.data[0], lines, message: 'Receiving session ready' };
  }
}
