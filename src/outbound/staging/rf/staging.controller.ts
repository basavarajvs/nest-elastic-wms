import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { StagingService } from '../staging.service';

@ApiTags('RF - Staging')
@Controller('rf/outbound/staging')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class RfStagingController {
  constructor(private readonly stagingService: StagingService) {}

  @Post('get-next')
  @ApiOperation({ summary: 'Get next staging task for operator' })
  @RfAction('read')
  async getNext(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = req.rfSession?.facilityId ? BigInt(req.rfSession.facilityId) : BigInt(dto.facilityId);
    const userId = req.rfSession?.userId || dto.userId;
    return this.stagingService.getNextStagingWork(tenantId, facilityId, userId);
  }

  @Post('scan-carton')
  @ApiOperation({ summary: 'Scan carton barcode for staging validation' })
  @RfAction('read')
  async scanCarton(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = req.rfSession?.facilityId ? BigInt(req.rfSession.facilityId) : BigInt(dto.facilityId);
    return this.stagingService.scanCartonForStaging(tenantId, facilityId, dto.cartonBarcode || dto.barcode);
  }

  @Post('confirm-lane')
  @ApiOperation({ summary: 'Confirm staging lane after scan' })
  @RfAction('update')
  async confirmLane(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = req.rfSession?.facilityId ? BigInt(req.rfSession.facilityId) : BigInt(dto.facilityId);
    const userId = req.rfSession?.userId || dto.userId;
    return this.stagingService.moveToStagingLane(
      tenantId,
      facilityId,
      BigInt(dto.lpnId || dto.cartonId),
      BigInt(dto.laneId),
      userId,
    );
  }

  @Post('my-tasks')
  @ApiOperation({ summary: 'List staging tasks for current operator' })
  @RfAction('read')
  async myTasks(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = req.rfSession?.facilityId ? BigInt(req.rfSession.facilityId) : BigInt(dto.facilityId);
    return this.stagingService.findAllLanes(tenantId, facilityId);
  }

  // APP-SHIP-G: Undo staging
  @Post('undo-stage')
  @ApiOperation({ summary: 'Reverse staging — STAGED → PACKED (RF)' })
  @RfAction('update')
  async undoStage(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.stagingService.undoStage(tenantId, BigInt(dto.lpnId), dto.reasonCode || 'WRONG_LANE');
  }

  // APP-SHIP-K: RF lane contents
  @Post('lane-contents')
  @ApiOperation({ summary: 'Get cartons staged at a lane (RF)' })
  @RfAction('read')
  async laneContents(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = req.rfSession?.facilityId ? BigInt(req.rfSession.facilityId) : BigInt(dto.facilityId);
    return this.stagingService.getLaneContentsRF(tenantId, facilityId, dto.laneCode);
  }
}
