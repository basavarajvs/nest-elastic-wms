import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { QualityInspectionsService } from '../quality-inspections.service';
import { CreateInspectionResultDto } from '../dtos/inspection.dto';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../../common/guards/rf-action.decorator';

@ApiTags('WMS-RF')
@Controller('rf/quality/inspections')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class QualityInspectionsRfController {
  constructor(private readonly service: QualityInspectionsService) {}

  @Post('my-tasks')
  @RfAction('read')
  @ApiOperation({ summary: 'RF: List assigned inspections' })
  async myTasks(@Req() req: any) {
    return this.service.findMyTasks(req.tenantContext.getTenantId(), req.user?.userId);
  }

  @Post(':id/record-result')
  @RfAction('update')
  @ApiOperation({ summary: 'RF: Record inspection result' })
  async recordResult(@Param('id') id: string, @Body() dto: CreateInspectionResultDto, @Req() req: any) {
    return this.service.recordRfResult(id, dto, req.tenantContext.getTenantId(), req.user?.userId);
  }
}
