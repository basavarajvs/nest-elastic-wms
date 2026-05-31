import { ApiTags } from '@nestjs/swagger';
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { InventoryTransferService } from '../inventory-transfer.service';
import { ReceiveLpnTransferDto } from '../dtos/transfer.dto';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { RfAction } from '../../common/guards/rf-action.decorator';
import { RfActionLightweightGuard } from '../../common/guards/rf-action-lightweight.guard';

@ApiTags('WMS-RF')
@Controller('rf/transfers')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class TransferRfController {
  constructor(private readonly transferService: InventoryTransferService) {}

  @Post('/initiate')
  @RfAction('read')
  async initiate(@Req() req: any, @Body('transferId') transferId: string) {
    const tenantId = req.tenantContext.getTenantId();
    const transfer = await (req.prisma as any)?.inventoryTransfer?.findFirst?.({ where: { id: transferId, tenantId }, include: { lines: true } });
    return { transferId, linesToScan: transfer?.lines || [] };
  }

  @Post('/scan-lpn')
  @RfAction('update')
  async scanLpn(@Req() req: any, @Body() dto: ReceiveLpnTransferDto) {
    return this.transferService.receiveLPN(dto, req.tenantContext.getTenantId(), req.user?.userId);
  }

  @Post('/complete')
  @RfAction('update')
  async complete(@Req() req: any, @Body('transferId') transferId: string) {
    const result = await this.transferService.reconcileDiscrepancies(transferId, req.tenantContext.getTenantId());
    return { status: 'RECEIVED', discrepancies: result.discrepancies.length };
  }
}
