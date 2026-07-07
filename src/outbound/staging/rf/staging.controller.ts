import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { StagingService } from '../staging.service';
import {
  RfGetNextStagingDto, RfScanCartonStagingDto, RfConfirmLaneDto,
  RfMyStagingTasksDto, RfUndoStageDto, RfLaneContentsDto,
  RfGetNextStagingResponseDto, RfScanCartonStagingResponseDto,
  RfConfirmLaneResponseDto, RfMyStagingTasksResponseDto,
  RfUndoStageResponseDto, RfLaneContentsResponseDto,
} from '../dtos/response.dto';

@ApiTags('RF - Staging')
@Controller('rf/outbound/staging')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class RfStagingController {
  constructor(private readonly stagingService: StagingService) {}

  @Post('get-next')
  @ApiOperation({ summary: 'Get next staging task for operator' })
  @RfAction('read')
  @ApiCreatedResponse({ type: RfGetNextStagingResponseDto })
  async getNext(@Req() req: any, @Body() dto: RfGetNextStagingDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = req.rfSession?.facilityId ? BigInt(req.rfSession.facilityId) : BigInt(dto.facility_id || 0);
    const userId = req.rfSession?.userId || dto.user_id || '';
    return this.stagingService.getNextStagingWork(tenantId, facilityId, userId);
  }

  @Post('scan-carton')
  @ApiOperation({ summary: 'Scan carton barcode for staging validation' })
  @RfAction('read')
  @ApiCreatedResponse({ type: RfScanCartonStagingResponseDto })
  async scanCarton(@Req() req: any, @Body() dto: RfScanCartonStagingDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = req.rfSession?.facilityId ? BigInt(req.rfSession.facilityId) : BigInt(dto.facility_id || 0);
    return this.stagingService.scanCartonForStaging(tenantId, facilityId, dto.carton_barcode || dto.barcode || '');
  }

  @Post('confirm-lane')
  @ApiOperation({ summary: 'Confirm staging lane after scan' })
  @RfAction('update')
  @ApiCreatedResponse({ type: RfConfirmLaneResponseDto })
  async confirmLane(@Req() req: any, @Body() dto: RfConfirmLaneDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = req.rfSession?.facilityId ? BigInt(req.rfSession.facilityId) : BigInt(dto.facility_id || 0);
    const userId = req.rfSession?.userId || dto.user_id || '';
    return this.stagingService.moveToStagingLane(
      tenantId,
      facilityId,
      BigInt(dto.lpn_id),
      BigInt(dto.lane_id),
      userId,
    );
  }

  @Post('my-tasks')
  @ApiOperation({ summary: 'List staging tasks for current operator' })
  @RfAction('read')
  @ApiCreatedResponse({ type: RfMyStagingTasksResponseDto })
  async myTasks(@Req() req: any, @Body() dto: RfMyStagingTasksDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = req.rfSession?.facilityId ? BigInt(req.rfSession.facilityId) : BigInt(dto.facility_id || 0);
    return this.stagingService.findAllLanes(tenantId, facilityId);
  }

  // APP-SHIP-G: Undo staging
  @Post('undo-stage')
  @ApiOperation({ summary: 'Reverse staging — STAGED → PACKED (RF)' })
  @RfAction('update')
  @ApiCreatedResponse({ type: RfUndoStageResponseDto })
  async undoStage(@Req() req: any, @Body() dto: RfUndoStageDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.stagingService.undoStage(tenantId, BigInt(dto.lpn_id), dto.reason_code || 'WRONG_LANE');
  }

  // APP-SHIP-K: RF lane contents
  @Post('lane-contents')
  @ApiOperation({ summary: 'Get cartons staged at a lane (RF)' })
  @RfAction('read')
  @ApiCreatedResponse({ type: RfLaneContentsResponseDto })
  async laneContents(@Req() req: any, @Body() dto: RfLaneContentsDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = req.rfSession?.facilityId ? BigInt(req.rfSession.facilityId) : BigInt(dto.facility_id || 0);
    return this.stagingService.getLaneContentsRF(tenantId, facilityId, dto.lane_code);
  }
}
