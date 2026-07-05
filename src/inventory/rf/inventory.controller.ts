import { Controller, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../common/decorators/rf-action.decorator';
import { HoldService } from '../holds/hold.service';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('WMS-RF')
@Controller('rf/inventory')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class InventoryRfController {
  constructor(
    private readonly holdService: HoldService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('holds/place')
  @RfAction('create')
  async placeHold(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession.userId;
    return this.holdService.create(tenantId, { ...dto, placed_by_user_id: userId });
  }

  @Post('holds/:id/release')
  @RfAction('update')
  async releaseHold(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession.userId;
    return this.holdService.release(tenantId, id, userId, dto?.reason, dto?.supervisorPinOverride);
  }

  @Post('holds/:lotId')
  @RfAction('read')
  async checkHoldsForLot(@Req() req: any, @Param('lotId') lotId: string) {
    const tenantId = req.tenantContext.getTenantId();
    const items = await this.prisma.inventory_items.findMany({
      where: { tenant_id: tenantId, lot_id: BigInt(lotId) },
      select: { item_id: true },
    });
    const itemIds = items.map((i) => i.item_id);
    if (!itemIds.length) return [];
    return this.prisma.inventory_holds.findMany({
      where: { tenant_id: tenantId, inventory_item_id: { in: itemIds } },
      orderBy: { placed_at: 'desc' },
    });
  }

  @Post('transfer')
  @RfAction('update')
  async transfer(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession.userId;
    const { facilityId, productId, fromLocationId, toLocationId, lotId, quantity } = dto;

    await this.prisma.inventory_transactions.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(facilityId),
        product_id: BigInt(productId),
        reference_type: 'RF_TRANSFER',
        reference_id: 0,
        from_location_id: BigInt(fromLocationId),
        to_location_id: BigInt(toLocationId),
        lot_id: lotId ? BigInt(lotId) : undefined,
        transaction_type: 'TRANSFER',
        transaction_status: 'COMPLETED',
        quantity: quantity,
        uom_id: dto.uomId ?? 1,
        reason_code: 'RF_TRANSFER',
        performed_by_user_id: userId,
      },
    });

    const srcWhere: any = {
      tenant_id: tenantId,
      facility_id: BigInt(facilityId),
      product_id: BigInt(productId),
      location_id: BigInt(fromLocationId),
    };
    if (lotId) srcWhere.lot_id = BigInt(lotId);
    else srcWhere.lot_id = null;
    await this.prisma.inventory_on_hand.updateMany({
      where: srcWhere,
      data: { quantity_on_hand: { decrement: quantity } },
    });

    const destWhere: any = {
      tenant_id: tenantId,
      facility_id: BigInt(facilityId),
      product_id: BigInt(productId),
      location_id: BigInt(toLocationId),
    };
    if (lotId) destWhere.lot_id = BigInt(lotId);
    else destWhere.lot_id = null;
    const existing = await this.prisma.inventory_on_hand.findFirst({
      where: destWhere,
    });

    if (existing) {
      await this.prisma.inventory_on_hand.updateMany({
        where: { on_hand_id: existing.on_hand_id },
        data: { quantity_on_hand: { increment: quantity } },
      });
    } else {
      await this.prisma.inventory_on_hand.create({
        data: {
          tenant_id: tenantId,
          facility_id: BigInt(facilityId),
          product_id: BigInt(productId),
          location_id: BigInt(toLocationId),
          lot_id: lotId ? BigInt(lotId) : undefined,
          quantity_on_hand: quantity,
          uom_id: dto.uomId ?? 1,
        },
      });
    }

    return { success: true };
  }
}
