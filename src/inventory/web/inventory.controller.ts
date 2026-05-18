import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { InventoryOnHandService } from '../inventory-onhand.service';
import { InventoryTransactionService } from '../inventory-transaction.service';
import { InventoryAdjustmentService } from '../inventory-adjustment.service';
import { InventoryHoldService } from '../inventory-hold.service';
import { InventoryPolicyService } from '../inventory-policy.service';
import { CreateAdjustmentDto } from '../dtos/adjustment.dto';
import { UpsertPolicyDto } from '../dtos/policy.dto';
import { StockFilterDto } from '../dtos/stock-filter.dto';
import { QuotaCheck } from '../../common/decorators/quota-check.decorator';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { QuotaGuard } from '../../common/guards/quota.guard';
import { CaslGuard } from '../../common/guards/casl.guard';

@Controller('/api/v1/wms/web/inventory')
@UseGuards(CaslGuard)
export class InventoryWebController {
  constructor(
    private readonly onHandService: InventoryOnHandService,
    private readonly txnService: InventoryTransactionService,
    private readonly adjService: InventoryAdjustmentService,
    private readonly holdService: InventoryHoldService,
    private readonly policyService: InventoryPolicyService,
  ) {}

  @Get('/stock')
  @CheckAbility({ action: 'read', subject: 'InventoryOnHand' })
  async getStock(@Req() req: any, @Query() filter: StockFilterDto) {
    return this.onHandService.findStock(req.tenantContext.getTenantId(), filter);
  }

  @Get('/low-stock')
  async getLowStock(@Req() req: any, @Query('facilityId') facilityId: string) {
    return this.onHandService.getLowStockItems(req.tenantContext.getTenantId(), facilityId);
  }

  @Post('/adjustments')
  @UseGuards(QuotaGuard)
  @QuotaCheck('inventory_adjustments')
  @CheckAbility({ action: 'create', subject: 'InventoryAdjustment' })
  async createAdjustment(@Req() req: any, @Body() dto: CreateAdjustmentDto) {
    return this.adjService.createDraft(dto, req.tenantContext.getTenantId(), req.user?.userId);
  }

  @Get('/adjustments')
  @CheckAbility({ action: 'read', subject: 'InventoryAdjustment' })
  async listAdjustments(
    @Req() req: any,
    @Query('status') status: string,
    @Query('facilityId') facilityId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.adjService.list(req.tenantContext.getTenantId(), { status, facilityId, page, limit });
  }

  @Patch('/adjustments/:id/submit')
  @CheckAbility({ action: 'update', subject: 'InventoryAdjustment' })
  async submitAdjustment(@Req() req: any, @Param('id') id: string) {
    return this.adjService.submit(id, req.tenantContext.getTenantId());
  }

  @Patch('/adjustments/:id/approve')
  @CheckAbility({ action: 'approve', subject: 'InventoryAdjustment' })
  async approveAdjustment(@Req() req: any, @Param('id') id: string) {
    return this.adjService.approve(id, req.tenantContext.getTenantId(), req.user?.userId);
  }

  @Get('/holds')
  @CheckAbility({ action: 'read', subject: 'InventoryHold' })
  async listHolds(
    @Req() req: any,
    @Query('status') status: string,
    @Query('facilityId') facilityId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.holdService.listHolds(req.tenantContext.getTenantId(), { status, facilityId, page, limit });
  }

  @Post('/policies')
  @CheckAbility({ action: 'create', subject: 'InventoryPolicy' })
  async upsertPolicy(@Req() req: any, @Body() dto: UpsertPolicyDto) {
    return this.policyService.upsert(dto, req.tenantContext.getTenantId());
  }
}
