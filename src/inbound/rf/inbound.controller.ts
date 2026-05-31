import { ApiTags } from '@nestjs/swagger';
import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { GrnService } from '../grn.service';
import { PutawayService } from '../putaway.service';
import { QcService } from '../qc.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LocationValidationGuard } from '../location-validation.guard';
import { RfReceiveDto } from '../dtos/grn.dto';
import { QcRfResultDto } from '../dtos/qc.dto';
import { ConfirmPutawayDto } from '../dtos/putaway.dto';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { RfAction } from '../../common/guards/rf-action.decorator';
import { RfActionLightweightGuard } from '../../common/guards/rf-action-lightweight.guard';

@ApiTags('WMS-RF')
@Controller('rf/inbound')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class InboundRfController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly grnService: GrnService,
    private readonly putawayService: PutawayService,
    private readonly qcService: QcService,
  ) {}

  @Post('/receive/start')
  @RfAction('read')
  async startReceiving(@Req() req: any, @Body('asnNumber') asnNumber: string) {
    const tenantId = req.tenantContext.getTenantId();
    if (asnNumber) {
      const grn = await this.grnService.createFromAsn(asnNumber, tenantId);
      return { grnId: grn.id, linesToReceive: grn.lines };
    }
    const lines = await this.grnService.getLinesForReceiving(tenantId, req.body.facilityId);
    return { linesToReceive: lines };
  }

  @Post('/receive/scan')
  @RfAction('create')
  async receiveScan(@Req() req: any, @Body() dto: RfReceiveDto) {
    return this.grnService.receiveLine(dto, req.tenantContext.getTenantId());
  }

  @Post('/receive/complete')
  @RfAction('update')
  async completeReceiving(@Req() req: any, @Body('grnId') grnId: string) {
    return this.grnService.completeReceipt(grnId, req.tenantContext.getTenantId());
  }

  @Post('/qc/scan')
  @RfAction('read')
  async qcScan(@Req() req: any, @Body('lpnNumber') lpnNumber: string) {
    const tenantId = req.tenantContext.getTenantId();
    const lpn = await (req.prisma || this.grnService as any).lPN?.findFirst({
      where: { lpnNumber, tenantId },
    });
    if (!lpn) return { error: 'LPN not found' };
    return { lpnNumber: lpn.lpnNumber, productId: lpn.productId, quantity: lpn.quantity, status: lpn.status };
  }

  @Post('/qc/result')
  @RfAction('update')
  async qcResult(@Req() req: any, @Body() dto: QcRfResultDto) {
    return this.qcService.rfInspect(dto, req.tenantContext.getTenantId());
  }

  @Get('/putaway/next')
  @RfAction('read')
  async getNextPutaway(@Req() req: any) {
    return this.putawayService.getNextTask(req.tenantContext.getTenantId(), req.user?.userId);
  }

  @Post('/putaway/confirm')
  @UseGuards(LocationValidationGuard)
  @RfAction('update')
  async confirmPutaway(@Req() req: any, @Body() dto: ConfirmPutawayDto) {
    return this.putawayService.confirmPutaway(
      dto.taskId, dto.scannedLocationId, req.tenantContext.getTenantId(), dto.supervisorPinOverride,
    );
  }
}
