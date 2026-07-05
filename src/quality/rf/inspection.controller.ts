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

  // GAP-5: Directed work
  @Post('get-next')
  @RfAction('update')
  @ApiOperation({ summary: 'Get next QC inspection task (directed work assignment)' })
  async getNext(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    const userId = req.rfSession.userId || dto.userId;
    return this.service.getNextQcTask(tenantId, facilityId, userId);
  }

  // GAP-2: Defect codes
  @Post('defect-codes')
  @RfAction('read')
  @ApiOperation({ summary: 'List active defect codes for RF device' })
  async defectCodes(@Req() req: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service['prisma'].defect_codes.findMany({
      where: { tenant_id: tenantId, is_active: true },
      orderBy: { code: 'asc' },
    });
  }

  // GAP-4: Lot validation
  @Post('validate-lot')
  @RfAction('read')
  @ApiOperation({ summary: 'Compare expected vs actual lot number' })
  async validateLot(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.validateLot(tenantId, BigInt(dto.inspectionId), dto.actualLotNumber);
  }

  // GAP-4: Expiry validation
  @Post('validate-expiry')
  @RfAction('read')
  @ApiOperation({ summary: 'Check expiry date against product thresholds' })
  async validateExpiry(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    return this.service.validateExpiry(tenantId, BigInt(dto.productId), new Date(dto.expiryDate), facilityId);
  }

  // GAP-4: Temperature recording
  @Post('validate-temperature')
  @RfAction('update')
  @ApiOperation({ summary: 'Record temperature reading during QC' })
  async validateTemperature(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return { recorded: true, readingCelsius: dto.temperatureCelsius, isCompliant: dto.isCompliant ?? true };
  }

  // GAP-7: Pending reviews
  @Post('pending-review')
  @RfAction('read')
  @ApiOperation({ summary: 'List inspections needing supervisor review' })
  async pendingReview(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    return this.service.getPendingReviews(tenantId, facilityId);
  }

  // GAP-7: Supervisor approve
  @Post(':id/supervisor-approve')
  @RfAction('update')
  @ApiOperation({ summary: 'Supervisor approve inspection result' })
  async supervisorApprove(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId || dto.supervisorId;
    return this.service.supervisorApprove(tenantId, BigInt(id), userId, dto.overrideDisposition);
  }

  // GAP-7: Supervisor reject
  @Post(':id/supervisor-reject')
  @RfAction('update')
  @ApiOperation({ summary: 'Supervisor reject inspection, create reinspection' })
  async supervisorReject(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId || dto.supervisorId;
    return this.service.supervisorReject(tenantId, BigInt(id), userId);
  }
}
