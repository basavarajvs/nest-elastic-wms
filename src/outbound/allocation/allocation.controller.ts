import { Controller, Post, Get, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { WmsAction } from '../../casl/casl.types';
import { AllocationService } from './allocation.service';

@ApiTags('Outbound - Allocation')
@Controller('web')
@UseGuards(JwtAuthGuard, CaslGuard)
export class AllocationWebController {
  constructor(private readonly service: AllocationService) {}

  @Post('inventory-allocations/allocate-line')
  @CheckAbility({ action: WmsAction.Create, subject: 'InventoryAllocation' })
  async allocateLine(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.allocateForLine(
      tenantId, BigInt(dto.facilityId), BigInt(dto.orderLineId), BigInt(dto.productId), dto.quantity,
    );
  }

  @Post('inventory-allocations/allocate-order')
  @CheckAbility({ action: WmsAction.Create, subject: 'InventoryAllocation' })
  async allocateOrder(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.allocateOrder(tenantId, BigInt(dto.facilityId), BigInt(dto.orderId));
  }

  @Post('inventory-allocations/deallocate')
  @CheckAbility({ action: WmsAction.Delete, subject: 'InventoryAllocation' })
  async deallocate(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.deallocate(tenantId, dto.referenceType, BigInt(dto.referenceId));
  }

  @Get('inventory-allocations/check-availability')
  @CheckAbility({ action: WmsAction.Read, subject: 'InventoryAllocation' })
  async checkAvailability(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.checkAvailability(tenantId, BigInt(dto.facilityId), BigInt(dto.productId), dto.requiredQty);
  }

  @Get('outbound/orders/:id/allocations')
  @CheckAbility({ action: WmsAction.Read, subject: 'InventoryAllocation' })
  async findByOrderId(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findByOrderId(tenantId, id);
  }

}
