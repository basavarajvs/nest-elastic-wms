import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../common/decorators/rf-action.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { TransfersService } from '../transfers.service';

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
  async initiate(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Post('scan-lpn')
  @RfAction('read')
  async scanLpn(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const lpn = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT l.*, ioh.product_id, ioh.quantity, ioh.facility_id
       FROM lpns l
       JOIN inventory_on_hand ioh ON ioh.lpn_id = l.id
       WHERE l.barcode = $1 AND ioh.tenant_id = $2::uuid
       LIMIT 1`,
      dto.barcode,
      tenantId,
    );
    return lpn.length ? lpn[0] : null;
  }

  @Post('complete')
  @RfAction('update')
  async complete(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.receive(tenantId, BigInt(dto.transferId), dto);
  }
}
