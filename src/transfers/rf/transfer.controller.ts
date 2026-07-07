import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse } from '@nestjs/swagger';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../common/decorators/rf-action.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { TransfersService } from '../transfers.service';
import { InventoryTransferDto, LpnScanResultDto, RfTransferInitiateDto, RfTransferScanLpnDto, RfTransferCompleteDto } from '../dtos/transfer.dto';

@ApiTags('WMS-RF')
@Controller('rf/transfers')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class TransferRfController {
  constructor(
    private readonly service: TransfersService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('initiate')
  @RfAction('create')
  @ApiCreatedResponse({ type: InventoryTransferDto })
  async initiate(@Req() req: any, @Body() dto: RfTransferInitiateDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Post('scan-lpn')
  @RfAction('read')
  @ApiCreatedResponse({ type: LpnScanResultDto })
  async scanLpn(@Req() req: any, @Body() dto: RfTransferScanLpnDto) {
    const tenantId = req.tenantContext.getTenantId();
    const lpn = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT l.*, ioh.product_id, ioh.quantity, ioh.facility_id,
              p.product_name, wf.facility_name
       FROM lpns l
       JOIN inventory_on_hand ioh ON ioh.lpn_id = l.id
       LEFT JOIN products p ON p.product_id = ioh.product_id
       LEFT JOIN warehouse_facilities wf ON wf.facility_id = ioh.facility_id AND wf.tenant_id = ioh.tenant_id
       WHERE l.barcode = $1 AND ioh.tenant_id = $2::uuid
       LIMIT 1`,
      dto.barcode,
      tenantId,
    );
    return lpn.length ? lpn[0] : null;
  }

  @Post('complete')
  @RfAction('update')
  @ApiCreatedResponse({ type: InventoryTransferDto })
  async complete(@Req() req: any, @Body() dto: RfTransferCompleteDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.receive(tenantId, BigInt(dto.transfer_id), dto);
  }
}
