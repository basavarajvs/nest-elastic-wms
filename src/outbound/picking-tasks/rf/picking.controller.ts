import { Controller, Post, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';
import { PickingTaskService } from '../picking-task.service';
import { ClusterPickService } from '../cluster-pick.service';
import { PickRouteService } from '../pick-route.service';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  RfNextPickTaskDto, RfScanPickDto, RfScanPickLocationDto, RfScanPickProductDto,
  RfAssignPickTaskDto, RfScanToteDto, RfConfirmPickDto, RfConfirmPickByLpnDto,
  RfShortPickDto, RfMyPickTasksDto, RfWaveStatusDto, RfValidatePrePickDto,
  RfSetupClusterDto, RfClusterNextDto, RfDistributePickDto,
  RfClusterCompleteDto, RfBatchStartDto, RfBulkConfirmDto, RfBatchCompleteDto,
  CreateBackorderRecordDto, CreateBatchSortationDto, CreatePickBatchDto,
  RfScanPalletPickDto, RfConfirmPalletDto, RfNextInterleavedDto, RfAutoUnassignDto,
  RfResumePickDto, RfSavePickStateDto, RfSetEquipmentDto,
  RfNextPickTaskResponseDto, RfScanPickResponseDto,
  RfScanPickLocationResponseDto, RfScanPickProductResponseDto,
  RfAssignPickTaskResponseDto, RfScanToteResponseDto,
  RfConfirmPickResponseDto, RfConfirmPickByLpnResponseDto,
  RfShortPickResponseDto, RfMyPickTasksResponseDto,
  RfWaveStatusResponseDto, RfValidatePrePickResponseDto,
  RfCreateBackorderResponseDto, RfSetupClusterResponseDto,
  RfClusterNextResponseDto, RfDistributePickResponseDto,
  RfClusterCompleteResponseDto, RfBatchStartResponseDto,
  RfBulkConfirmResponseDto, RfBatchCompleteResponseDto,
  RfScanPalletPickResponseDto, RfConfirmPalletResponseDto,
  RfNextInterleavedResponseDto, RfAutoUnassignResponseDto,
  RfResumePickResponseDto, RfSavePickStateResponseDto,
  RfSetEquipmentResponseDto,
} from '../dtos/response.dto';

@ApiTags('RF - Picking')
@Controller('rf/outbound/pick')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class RfPickingController {
  constructor(
    private readonly pickingTaskService: PickingTaskService,
    private readonly clusterPickService: ClusterPickService,
    private readonly pickRouteService: PickRouteService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('next-task')
  @ApiOperation({ summary: 'Get next available pick task (RF) with equipment/route optimization' })
  @RfAction('read')
  @ApiCreatedResponse({ type: RfNextPickTaskResponseDto })
  async nextTask(@Req() req: any, @Body() dto: RfNextPickTaskDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.nextTask(tenantId, BigInt(dto.facility_id), dto.user_id);
  }

  @Post('scan')
  @ApiOperation({ summary: 'Scan barcode to find pick task (RF)' })
  @RfAction('read')
  @ApiCreatedResponse({ type: RfScanPickResponseDto })
  async scan(@Req() req: any, @Body() dto: RfScanPickDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.findTaskByBarcode(tenantId, BigInt(dto.facility_id), dto.barcode);
  }

  @Post('scan-location')
  @ApiOperation({ summary: 'Verify pick location by scanning location barcode (RF)' })
  @RfAction('read')
  @ApiCreatedResponse({ type: RfScanPickLocationResponseDto })
  async scanLocation(@Req() req: any, @Body() dto: RfScanPickLocationDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.scanLocation(tenantId, BigInt(dto.task_id), dto.location_barcode);
  }

  @Post('scan-product')
  @ApiOperation({ summary: 'Verify product by scanning product barcode (RF)' })
  @RfAction('read')
  @ApiCreatedResponse({ type: RfScanPickProductResponseDto })
  async scanProduct(@Req() req: any, @Body() dto: RfScanPickProductDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.scanProduct(tenantId, BigInt(dto.task_id), dto.product_code);
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assign pick task to user (RF)' })
  @RfAction('update')
  @ApiCreatedResponse({ type: RfAssignPickTaskResponseDto })
  async assign(@Req() req: any, @Body() dto: RfAssignPickTaskDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.assignTask(tenantId, BigInt(dto.task_id), dto.user_id);
  }

  @Post('scan-tote')
  @ApiOperation({ summary: 'Scan destination tote/carton barcode (RF)' })
  @RfAction('read')
  @ApiCreatedResponse({ type: RfScanToteResponseDto })
  async scanTote(@Req() req: any, @Body() dto: RfScanToteDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id || 0);
    return this.pickingTaskService.scanTote(tenantId, BigInt(dto.task_id), dto.tote_barcode, facilityId);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm pick — record picked qty, update inventory (RF)' })
  @RfAction('update')
  @ApiCreatedResponse({ type: RfConfirmPickResponseDto })
  async confirm(@Req() req: any, @Body() dto: RfConfirmPickDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.confirmPick(tenantId, BigInt(dto.task_id), dto);
  }

  @Post('confirm-lpn')
  @ApiOperation({ summary: 'Confirm pick by scanning LPN barcode (RF)' })
  @RfAction('update')
  @ApiCreatedResponse({ type: RfConfirmPickByLpnResponseDto })
  async confirmByLpn(@Req() req: any, @Body() dto: RfConfirmPickByLpnDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.confirmPickByLpn(tenantId, BigInt(dto.task_id), dto.lpn_barcode);
  }

  @Post('short-pick')
  @ApiOperation({ summary: 'Short pick — pick partial qty with reason (RF)' })
  @RfAction('update')
  @ApiCreatedResponse({ type: RfShortPickResponseDto })
  async shortPick(@Req() req: any, @Body() dto: RfShortPickDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.shortPick(tenantId, BigInt(dto.task_id), dto);
  }

  @Post('my-tasks')
  @ApiOperation({ summary: 'Get my active pick tasks (RF)' })
  @RfAction('read')
  @ApiCreatedResponse({ type: RfMyPickTasksResponseDto })
  async myTasks(@Req() req: any, @Body() dto: RfMyPickTasksDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.myTasks(tenantId, dto.user_id || '', dto.facility_id ? BigInt(dto.facility_id) : undefined);
  }

  @Post('wave-status')
  @ApiOperation({ summary: 'View current wave progress (RF)' })
  @RfAction('read')
  @ApiCreatedResponse({ type: RfWaveStatusResponseDto })
  async waveStatus(@Req() req: any, @Body() dto: RfWaveStatusDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id || 0);
    return this.pickingTaskService.findAllTasks(tenantId, { facilityId: facilityId.toString(), status: dto.status });
  }

  @Post('validate-inventory')
  @ApiOperation({ summary: 'Pre-pick inventory validation check (RF)' })
  @RfAction('read')
  @ApiCreatedResponse({ type: RfValidatePrePickResponseDto })
  async validateInventory(@Req() req: any, @Body() dto: RfValidatePrePickDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.validatePrePick(tenantId, BigInt(dto.task_id));
  }

  @Post('create-backorder')
  @ApiOperation({ summary: 'Create backorder for shortfall (RF)' })
  @RfAction('create')
  @ApiCreatedResponse({ type: RfCreateBackorderResponseDto })
  async createBackorder(@Req() req: any, @Body() dto: CreateBackorderRecordDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.createBackorder(tenantId, BigInt(dto.order_line_id), Number(dto.shortfall_qty));
  }

  // GAP-1.4: Cluster Pick endpoints
  @Post('setup-cluster')
  @ApiOperation({ summary: 'Setup cluster pick with cart + totes (RF)' })
  @RfAction('create')
  @ApiCreatedResponse({ type: RfSetupClusterResponseDto })
  async setupCluster(@Req() req: any, @Body() dto: RfSetupClusterDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clusterPickService.setupClusterPick(tenantId, dto.user_id || '', BigInt(dto.cart_id), dto.tote_barcodes || []);
  }

  @Post('cluster-next')
  @ApiOperation({ summary: 'Next task for cluster session (RF)' })
  @RfAction('read')
  @ApiCreatedResponse({ type: RfClusterNextResponseDto })
  async clusterNext(@Req() req: any, @Body() dto: RfClusterNextDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clusterPickService.getClusterPickTasks(tenantId, BigInt(dto.session_id));
  }

  @Post('distribute')
  @ApiOperation({ summary: 'Distribute pick to multiple totes (RF)' })
  @RfAction('update')
  @ApiCreatedResponse({ type: RfDistributePickResponseDto })
  async distribute(@Req() req: any, @Body() dto: RfDistributePickDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clusterPickService.distributePick(tenantId, BigInt(dto.task_id), dto.distributions);
  }

  @Post('cluster-complete')
  @ApiOperation({ summary: 'Complete cluster session (RF)' })
  @RfAction('update')
  @ApiCreatedResponse({ type: RfClusterCompleteResponseDto })
  async clusterComplete(@Req() req: any, @Body() dto: RfClusterCompleteDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clusterPickService.completeClusterSession(tenantId, BigInt(dto.session_id));
  }

  // GAP-2.3: Batch Pick endpoints
  @Post('batch-start')
  @ApiOperation({ summary: 'Start batch pick session (RF) — groups tasks by SKU' })
  @RfAction('create')
  @ApiCreatedResponse({ type: RfBatchStartResponseDto })
  async batchStart(@Req() req: any, @Body() dto: CreatePickBatchDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.createBatchPick(tenantId, dto);
  }

  @Post('bulk-confirm')
  @ApiOperation({ summary: 'Confirm bulk pick (batch) (RF)' })
  @RfAction('update')
  @ApiCreatedResponse({ type: RfBulkConfirmResponseDto })
  async bulkConfirm(@Req() req: any, @Body() dto: RfBulkConfirmDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.confirmPick(tenantId, BigInt(dto.task_id), {
      pickedQuantity: dto.picked_quantity,
      reasonCode: 'BATCH_BULK',
    });
  }

  @Post('batch-complete')
  @ApiOperation({ summary: 'Complete batch phase, trigger sortation (RF)' })
  @RfAction('update')
  @ApiCreatedResponse({ type: RfBatchCompleteResponseDto })
  async batchComplete(@Req() req: any, @Body() dto: CreateBatchSortationDto) {
    const tenantId = req.tenantContext.getTenantId();
    await this.prisma.pick_batch_sessions.updateMany({
      where: { tenant_id: tenantId, batch_id: BigInt(dto.batch_id) },
      data: { status: 'BULK_COMPLETE', updated_by: dto.created_by },
    });
    await this.prisma.batch_sortation_sessions.create({
      data: {
        tenant_id: tenantId,
        batch_id: BigInt(dto.batch_id),
        status: dto.status || 'PENDING',
        total_items: dto.total_items || 0,
        sorted_items: dto.sorted_items || 0,
        created_by: dto.created_by,
      },
    });
    return { batchId: dto.batch_id, status: 'BULK_COMPLETE', sortationCreated: true };
  }

  // APP-PICK-A: Full Pallet pick endpoints
  @Post('scan-pallet')
  @ApiOperation({ summary: 'Scan pallet LPN for full pallet pick (RF)' })
  @RfAction('read')
  @ApiCreatedResponse({ type: RfScanPalletPickResponseDto })
  async scanPallet(@Req() req: any, @Body() dto: RfScanPalletPickDto) {
    const tenantId = req.tenantContext.getTenantId();
    const lpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, facility_id: BigInt(dto.facility_id), lpn_number: dto.lpn_barcode },
    });
    if (!lpn) throw new BadRequestException('Pallet LPN not found');
    return { valid: true, lpn };
  }

  @Post('confirm-pallet')
  @ApiOperation({ summary: 'Confirm full pallet pick (RF)' })
  @RfAction('update')
  @ApiCreatedResponse({ type: RfConfirmPalletResponseDto })
  async confirmPallet(@Req() req: any, @Body() dto: RfConfirmPalletDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.confirmPick(tenantId, BigInt(dto.task_id), {
      ...dto,
      pickType: 'FULL_PALLET',
      reasonCode: 'FULL_PALLET',
    });
  }

  // GAP-6: Task interleaving
  @Post('next-interleaved')
  @ApiOperation({ summary: 'Get nearest interleavable pick task to a location (RF)' })
  @RfAction('read')
  @ApiCreatedResponse({ type: RfNextInterleavedResponseDto })
  async nextInterleaved(@Req() req: any, @Body() dto: RfNextInterleavedDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.getNextInterleavableTask(
      tenantId, BigInt(dto.facility_id), BigInt(dto.current_location_id || 0),
    );
  }

  // APP-PICK-I: Auto-unassign expired tasks
  @Post('auto-unassign')
  @ApiOperation({ summary: 'Auto-unassign expired/abandoned pick tasks (RF admin)' })
  @RfAction('update')
  @ApiCreatedResponse({ type: RfAutoUnassignResponseDto })
  async autoUnassign(@Req() req: any, @Body() dto: RfAutoUnassignDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.autoUnassignExpiredTasks(tenantId, BigInt(dto.facility_id));
  }

  // APP-PICK-M: Resume pick session
  @Post('resume')
  @ApiOperation({ summary: 'Resume pick session from last known state (RF)' })
  @RfAction('read')
  @ApiCreatedResponse({ type: RfResumePickResponseDto })
  async resume(@Req() req: any, @Body() dto: RfResumePickDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id || 0);
    return this.pickingTaskService.resumePickSession(tenantId, dto.user_id || '', facilityId);
  }

  // APP-PICK-M: Save pick state
  @Post('save-state')
  @ApiOperation({ summary: 'Save current pick state to session (RF)' })
  @RfAction('update')
  @ApiCreatedResponse({ type: RfSavePickStateResponseDto })
  async saveState(@Req() req: any, @Body() dto: RfSavePickStateDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.savePickState(tenantId, dto.user_id || '', dto.state || {});
  }

  // APP-PICK-B: Update operator equipment on session
  @Post('set-equipment')
  @ApiOperation({ summary: 'Set operator equipment type on RF session' })
  @RfAction('update')
  @ApiCreatedResponse({ type: RfSetEquipmentResponseDto })
  async setEquipment(@Req() req: any, @Body() dto: RfSetEquipmentDto) {
    const tenantId = req.tenantContext.getTenantId();
    const validEquipment = ['FORKLIFT', 'PALLET_JACK', 'HAND_TRUCK', 'PEDESTRIAN'];
    if (!validEquipment.includes(dto.equipment_type)) {
      throw new BadRequestException(`Invalid equipment type. Valid: ${validEquipment.join(', ')}`);
    }
    await this.prisma.$executeRawUnsafe(
      `UPDATE multitenant.db_rf_sessions
       SET equipment_type = $3, last_activity_at = NOW()
       WHERE tenant_id = $1::uuid AND user_id = $2::uuid AND status = 'ACTIVE'`,
       tenantId, dto.user_id, dto.equipment_type,
    );
    return { equipmentType: dto.equipment_type, saved: true };
  }
}
