import { Controller, Post, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';
import { PickingTaskService } from '../picking-task.service';
import { ClusterPickService } from '../cluster-pick.service';
import { PickRouteService } from '../pick-route.service';
import { PrismaService } from '../../../prisma/prisma.service';

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
  async nextTask(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.nextTask(tenantId, BigInt(dto.facilityId), dto.userId);
  }

  @Post('scan')
  @ApiOperation({ summary: 'Scan barcode to find pick task (RF)' })
  @RfAction('read')
  async scan(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.findTaskByBarcode(tenantId, BigInt(dto.facilityId), dto.barcode);
  }

  @Post('scan-location')
  @ApiOperation({ summary: 'Verify pick location by scanning location barcode (RF)' })
  @RfAction('read')
  async scanLocation(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.scanLocation(tenantId, BigInt(dto.taskId), dto.locationBarcode);
  }

  @Post('scan-product')
  @ApiOperation({ summary: 'Verify product by scanning product barcode (RF)' })
  @RfAction('read')
  async scanProduct(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.scanProduct(tenantId, BigInt(dto.taskId), dto.productCode);
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assign pick task to user (RF)' })
  @RfAction('update')
  async assign(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.assignTask(tenantId, BigInt(dto.taskId), dto.userId);
  }

  @Post('scan-tote')
  @ApiOperation({ summary: 'Scan destination tote/carton barcode (RF)' })
  @RfAction('read')
  async scanTote(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    return this.pickingTaskService.scanTote(tenantId, BigInt(dto.taskId), dto.toteBarcode, facilityId);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm pick — record picked qty, update inventory (RF)' })
  @RfAction('update')
  async confirm(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.confirmPick(tenantId, BigInt(dto.taskId), dto);
  }

  @Post('confirm-lpn')
  @ApiOperation({ summary: 'Confirm pick by scanning LPN barcode (RF)' })
  @RfAction('update')
  async confirmByLpn(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.confirmPickByLpn(tenantId, BigInt(dto.taskId), dto.lpnBarcode);
  }

  @Post('short-pick')
  @ApiOperation({ summary: 'Short pick — pick partial qty with reason (RF)' })
  @RfAction('update')
  async shortPick(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.shortPick(tenantId, BigInt(dto.taskId), dto);
  }

  @Post('my-tasks')
  @ApiOperation({ summary: 'Get my active pick tasks (RF)' })
  @RfAction('read')
  async myTasks(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.myTasks(tenantId, dto.userId, dto.facilityId ? BigInt(dto.facilityId) : undefined);
  }

  @Post('wave-status')
  @ApiOperation({ summary: 'View current wave progress (RF)' })
  @RfAction('read')
  async waveStatus(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    return this.pickingTaskService.findAllTasks(tenantId, { facilityId: facilityId.toString(), status: dto.status });
  }

  @Post('validate-inventory')
  @ApiOperation({ summary: 'Pre-pick inventory validation check (RF)' })
  @RfAction('read')
  async validateInventory(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.validatePrePick(tenantId, BigInt(dto.taskId));
  }

  @Post('create-backorder')
  @ApiOperation({ summary: 'Create backorder for shortfall (RF)' })
  @RfAction('create')
  async createBackorder(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.createBackorder(tenantId, BigInt(dto.orderLineId), Number(dto.shortfallQty));
  }

  // GAP-1.4: Cluster Pick endpoints
  @Post('setup-cluster')
  @ApiOperation({ summary: 'Setup cluster pick with cart + totes (RF)' })
  @RfAction('create')
  async setupCluster(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clusterPickService.setupClusterPick(tenantId, dto.userId, BigInt(dto.cartId), dto.toteBarcodes || []);
  }

  @Post('cluster-next')
  @ApiOperation({ summary: 'Next task for cluster session (RF)' })
  @RfAction('read')
  async clusterNext(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clusterPickService.getClusterPickTasks(tenantId, BigInt(dto.sessionId));
  }

  @Post('distribute')
  @ApiOperation({ summary: 'Distribute pick to multiple totes (RF)' })
  @RfAction('update')
  async distribute(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clusterPickService.distributePick(tenantId, BigInt(dto.taskId), dto.distributions);
  }

  @Post('cluster-complete')
  @ApiOperation({ summary: 'Complete cluster session (RF)' })
  @RfAction('update')
  async clusterComplete(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clusterPickService.completeClusterSession(tenantId, BigInt(dto.sessionId));
  }

  // GAP-2.3: Batch Pick endpoints
  @Post('batch-start')
  @ApiOperation({ summary: 'Start batch pick session (RF) — groups tasks by SKU' })
  @RfAction('create')
  async batchStart(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.createBatchPick(tenantId, dto);
  }

  @Post('bulk-confirm')
  @ApiOperation({ summary: 'Confirm bulk pick (batch) (RF)' })
  @RfAction('update')
  async bulkConfirm(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.confirmPick(tenantId, BigInt(dto.taskId), {
      pickedQuantity: dto.pickedQuantity,
      reasonCode: 'BATCH_BULK',
    });
  }

  @Post('batch-complete')
  @ApiOperation({ summary: 'Complete batch phase, trigger sortation (RF)' })
  @RfAction('update')
  async batchComplete(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    await this.prisma.pick_batch_sessions.updateMany({
      where: { tenant_id: tenantId, batch_id: BigInt(dto.batchId) },
      data: { status: 'BULK_COMPLETE', updated_by: dto.userId },
    });
    await this.prisma.batch_sortation_sessions.create({
      data: {
        tenant_id: tenantId,
        batch_id: BigInt(dto.batchId),
        status: 'PENDING',
        total_items: dto.totalItems || 0,
        created_by: dto.userId,
      },
    });
    return { batchId: dto.batchId, status: 'BULK_COMPLETE', sortationCreated: true };
  }

  // APP-PICK-A: Full Pallet pick endpoints
  @Post('scan-pallet')
  @ApiOperation({ summary: 'Scan pallet LPN for full pallet pick (RF)' })
  @RfAction('read')
  async scanPallet(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const lpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, facility_id: BigInt(dto.facilityId), lpn_number: dto.lpnBarcode },
    });
    if (!lpn) throw new BadRequestException('Pallet LPN not found');
    return { valid: true, lpn };
  }

  @Post('confirm-pallet')
  @ApiOperation({ summary: 'Confirm full pallet pick (RF)' })
  @RfAction('update')
  async confirmPallet(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.confirmPick(tenantId, BigInt(dto.taskId), {
      ...dto,
      pickType: 'FULL_PALLET',
      reasonCode: 'FULL_PALLET',
    });
  }

  // GAP-6: Task interleaving
  @Post('next-interleaved')
  @ApiOperation({ summary: 'Get nearest interleavable pick task to a location (RF)' })
  @RfAction('read')
  async nextInterleaved(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.getNextInterleavableTask(
      tenantId, BigInt(dto.facilityId), BigInt(dto.currentLocationId || 0),
    );
  }

  // APP-PICK-I: Auto-unassign expired tasks
  @Post('auto-unassign')
  @ApiOperation({ summary: 'Auto-unassign expired/abandoned pick tasks (RF admin)' })
  @RfAction('update')
  async autoUnassign(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.autoUnassignExpiredTasks(tenantId, BigInt(dto.facilityId));
  }

  // APP-PICK-M: Resume pick session
  @Post('resume')
  @ApiOperation({ summary: 'Resume pick session from last known state (RF)' })
  @RfAction('read')
  async resume(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facilityId);
    return this.pickingTaskService.resumePickSession(tenantId, dto.userId, facilityId);
  }

  // APP-PICK-M: Save pick state
  @Post('save-state')
  @ApiOperation({ summary: 'Save current pick state to session (RF)' })
  @RfAction('update')
  async saveState(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.savePickState(tenantId, dto.userId, dto.state || {});
  }

  // APP-PICK-B: Update operator equipment on session
  @Post('set-equipment')
  @ApiOperation({ summary: 'Set operator equipment type on RF session' })
  @RfAction('update')
  async setEquipment(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const validEquipment = ['FORKLIFT', 'PALLET_JACK', 'HAND_TRUCK', 'PEDESTRIAN'];
    if (!validEquipment.includes(dto.equipmentType)) {
      throw new BadRequestException(`Invalid equipment type. Valid: ${validEquipment.join(', ')}`);
    }
    await this.prisma.$executeRawUnsafe(
      `UPDATE multitenant.db_rf_sessions
       SET equipment_type = $3, last_activity_at = NOW()
       WHERE tenant_id = $1::uuid AND user_id = $2::uuid AND status = 'ACTIVE'`,
      tenantId, dto.userId, dto.equipmentType,
    );
    return { equipmentType: dto.equipmentType, saved: true };
  }
}
