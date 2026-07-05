import { Controller, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../common/decorators/rf-action.decorator';
import { InspectionService } from '../inspections/inspection.service';

@ApiTags('WMS-RF')
@Controller('rf/quality/inspections')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class RfInspectionController {
  constructor(private readonly service: InspectionService) {}

  @Post('lpn-lookup')
  @RfAction('read')
  @ApiOperation({ summary: 'Scan LPN barcode to fetch QC info (Manhattan: QC Inspect LPN)' })
  async lpnLookup(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    return this.service.lookupLpnForQc(tenantId, facilityId, dto.barcode);
  }

  @Post('my-tasks')
  @RfAction('read')
  @ApiOperation({ summary: 'Get inspections assigned to current RF user' })
  async myTasks(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession.userId;
    return this.service.findAll(tenantId, { assignedToUserId: userId, ...dto });
  }

  @Post(':id/record-result')
  @RfAction('update')
  @ApiOperation({ summary: 'Record inspection result from RF device' })
  async recordResult(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession.userId;
    return this.service.recordResult(tenantId, id, { ...dto, createdBy: userId, inspectorUserId: userId });
  }
}
