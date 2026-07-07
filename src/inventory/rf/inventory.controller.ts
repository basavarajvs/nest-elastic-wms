import { Controller, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse } from '@nestjs/swagger';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../common/decorators/rf-action.decorator';
import { HoldService } from '../holds/hold.service';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryHoldResponseDto, RfPlaceHoldDto, RfReleaseHoldDto, RfInventoryTransferDto, RfInventoryTransferResponseDto } from '../dtos/inventory-response.dto';

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
  @ApiCreatedResponse({ type: InventoryHoldResponseDto })
  async placeHold(@Req() req: any, @Body() dto: RfPlaceHoldDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession.userId;
    return this.holdService.create(tenantId, { ...dto, placed_by_user_id: userId });
  }

  @Post('holds/:id/release')
  @RfAction('update')
  @ApiCreatedResponse({ type: InventoryHoldResponseDto })
  async releaseHold(@Req() req: any, @Param('id') id: string, @Body() dto: RfReleaseHoldDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession.userId;
    return this.holdService.release(tenantId, id, userId, dto?.reason, dto?.supervisor_pin_override);
  }

  @Post('holds/:lotId')
  @RfAction('read')
  @ApiCreatedResponse({ type: [InventoryHoldResponseDto] })
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
  @ApiCreatedResponse({ type: RfInventoryTransferResponseDto })
  async transfer(@Req() req: any, @Body() dto: RfInventoryTransferDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession.userId;
    const { facility_id, product_id, from_location_id, to_location_id, lot_id, quantity } = dto;

    await this.prisma.inventory_transactions.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(facility_id),
        product_id: BigInt(product_id),
        reference_type: 'RF_TRANSFER',
        reference_id: 0,
        from_location_id: BigInt(from_location_id),
        to_location_id: BigInt(to_location_id),
        lot_id: lot_id ? BigInt(lot_id) : undefined,
        transaction_type: 'TRANSFER',
        transaction_status: 'COMPLETED',
        quantity: quantity,
        uom_id: Number(dto.uom_id) || 1,
        reason_code: 'RF_TRANSFER',
        performed_by_user_id: userId,
      },
    });

    const srcWhere: any = {
      tenant_id: tenantId,
      facility_id: BigInt(facility_id),
      product_id: BigInt(product_id),
      location_id: BigInt(from_location_id),
    };
    if (lot_id) srcWhere.lot_id = BigInt(lot_id);
    else srcWhere.lot_id = null;
    await this.prisma.inventory_on_hand.updateMany({
      where: srcWhere,
      data: { quantity_on_hand: { decrement: quantity } },
    });

    const destWhere: any = {
      tenant_id: tenantId,
      facility_id: BigInt(facility_id),
      product_id: BigInt(product_id),
      location_id: BigInt(to_location_id),
    };
    if (lot_id) destWhere.lot_id = BigInt(lot_id);
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
          facility_id: BigInt(facility_id),
          product_id: BigInt(product_id),
          location_id: BigInt(to_location_id),
          lot_id: lot_id ? BigInt(lot_id) : undefined,
          quantity_on_hand: quantity,
          uom_id: Number(dto.uom_id) || 1,
        },
      });
    }

    return { success: true };
  }
}
