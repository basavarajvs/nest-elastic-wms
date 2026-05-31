import { ApiTags } from '@nestjs/swagger';
import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import { CycleCountService } from '../cycle-count.service';
import { SubmitCountLineDto } from '../dtos/count.dto';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfAction } from '../../../common/guards/rf-action.decorator';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';

@ApiTags('WMS-RF')
@Controller('rf/cycle-counts')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class CountRfController {
  constructor(private readonly countService: CycleCountService) {}

  @Post('/start')
  @RfAction('read')
  async start(@Req() req: any, @Body('countId') countId: string, @Body('userId') userId: string) {
    await this.countService.assign(countId, userId, req.tenantContext.getTenantId());
    const count = await (req.prisma as any)?.cycleCount?.findFirst?.({ where: { id: countId }, include: { lines: { where: { status: 'PENDING' }, take: 1 } } });
    if (!count) return { error: 'Count not found' };
    return { countId, method: count.countMethod, firstLineId: count.lines[0]?.id, locationId: count.lines[0]?.locationId };
  }

  @Post('/scan-location')
  @RfAction('read')
  async scanLocation(@Req() req: any, @Body('lineId') lineId: string) {
    const line = await (req.prisma as any)?.cycleCountLine?.findFirst?.({ where: { id: lineId } });
    if (!line) return { error: 'Line not found' };
    return { locationCode: line.locationId, productCode: line.productId };
  }

  @Post('/enter-qty')
  @RfAction('update')
  async enterQty(@Req() req: any, @Body() dto: SubmitCountLineDto) {
    const result = await this.countService.submitLine(dto, req.tenantContext.getTenantId());
    return { varianceCalculated: result.varianceQuantity !== null, countedQuantity: dto.countedQuantity };
  }

  @Post('/submit-line')
  @RfAction('update')
  async submitLine(@Req() req: any, @Body() dto: SubmitCountLineDto) {
    return this.countService.submitLine(dto, req.tenantContext.getTenantId());
  }

  @Post('/complete')
  @RfAction('update')
  async complete(@Req() req: any, @Body('countId') countId: string) {
    const result = await this.countService.finalizeCount(countId, req.tenantContext.getTenantId());
    return { status: 'RECONCILED', autoAdjusted: result.autoAdjust };
  }
}
