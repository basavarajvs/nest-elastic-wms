import { ApiTags } from '@nestjs/swagger';
import { Controller, Post, Body, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { InventoryOnHandService } from '../inventory-onhand.service';
import { InventoryTransactionService } from '../inventory-transaction.service';
import { InventoryHoldService } from '../inventory-hold.service';
import { PrismaService } from '../../prisma/prisma.service';
import { HoldOverrideGuard, HoldOverride } from '../../common/guards/hold-override.guard';
import { CreateTransactionDto } from '../dtos/transaction.dto';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { RfAction } from '../../common/guards/rf-action.decorator';
import { RfActionLightweightGuard } from '../../common/guards/rf-action-lightweight.guard';

@ApiTags('WMS-RF')
@Controller('/api/v1/wms/rf/inventory')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class InventoryRfController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly onHandService: InventoryOnHandService,
    private readonly txnService: InventoryTransactionService,
    private readonly holdService: InventoryHoldService,
  ) {}

  @Post('/scan-location')
  @RfAction('read')
  async scanLocation(
    @Req() req: any,
    @Body('facilityId') facilityId: string,
    @Body('locationId') locationId: string,
  ) {
    const tenantId = req.tenantContext.getTenantId();
    const stock = await this.onHandService.scanLocation(tenantId, facilityId, locationId);
    const enriched = await Promise.all(
      stock.map(async (s: any) => {
        const holds = await this.holdService.checkHoldsForLot(tenantId, s.lotId);
        return { ...s, holds };
      }),
    );
    return enriched;
  }

  @Post('/transaction/putaway')
  @RfAction('create')
  async putaway(@Req() req: any, @Body() dto: CreateTransactionDto) {
    return this.txnService.executeTransaction(dto, req.tenantContext.getTenantId());
  }

  @Post('/transaction/pick')
  @UseGuards(HoldOverrideGuard)
  @HoldOverride()
  @RfAction('create')
  async pick(@Req() req: any, @Body() dto: CreateTransactionDto) {
    return this.txnService.executeTransaction(dto, req.tenantContext.getTenantId());
  }

  @Post('/adjustment/quick')
  @RfAction('create')
  async quickAdjustment(@Req() req: any, @Body() dto: CreateTransactionDto) {
    return this.txnService.executeTransaction(dto, req.tenantContext.getTenantId());
  }

  @Get('/lot/:lotNumber')
  @RfAction('read')
  async lookupLot(
    @Req() req: any,
    @Param('lotNumber') lotNumber: string,
    @Query('facilityId') facilityId: string,
    @Query('productId') productId: string,
  ) {
    const tenantId = req.tenantContext.getTenantId();
    return this.prisma.inventoryLot.findFirst({
      where: { tenantId, facilityId, productId, lotNumber },
    });
  }
}
