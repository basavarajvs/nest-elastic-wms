import { Controller, Post, Get, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { WmsAction } from '../../casl/casl.types';
import { AllocationService } from './allocation.service';
import {
  AllocateLineResultDto,
  AllocateOrderResultDto,
  DeallocateResultDto,
  CheckAvailabilityResultDto,
  AllocationRecordDto,
  AllocateLineDto,
  AllocateOrderDto,
  DeallocateDto,
  CheckAvailabilityDto,
} from './dtos/response.dto';

@ApiTags('Outbound - Allocation')
@Controller('web')
@UseGuards(JwtAuthGuard, CaslGuard)
export class AllocationWebController {
  constructor(private readonly service: AllocationService) {}

  @Post('inventory-allocations/allocate-line')
  @ApiOperation({ summary: 'Allocate inventory for a sales order line' })
  @ApiCreatedResponse({ type: AllocateLineResultDto })
  @CheckAbility({ action: WmsAction.Create, subject: 'InventoryAllocation' })
  async allocateLine(@Req() req: any, @Body() dto: AllocateLineDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.allocateForLine(
      tenantId, BigInt(dto.facility_id), BigInt(dto.order_line_id), BigInt(dto.product_id), dto.quantity,
    );
  }

  @Post('inventory-allocations/allocate-order')
  @ApiOperation({ summary: 'Allocate all lines for a sales order' })
  @ApiCreatedResponse({ type: AllocateOrderResultDto })
  @CheckAbility({ action: WmsAction.Create, subject: 'InventoryAllocation' })
  async allocateOrder(@Req() req: any, @Body() dto: AllocateOrderDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.allocateOrder(tenantId, BigInt(dto.facility_id), BigInt(dto.order_id));
  }

  @Post('inventory-allocations/deallocate')
  @ApiOperation({ summary: 'Deallocate inventory for a reference' })
  @ApiCreatedResponse({ type: DeallocateResultDto })
  @CheckAbility({ action: WmsAction.Delete, subject: 'InventoryAllocation' })
  async deallocate(@Req() req: any, @Body() dto: DeallocateDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.deallocate(tenantId, dto.reference_type, BigInt(dto.reference_id));
  }

  @Get('inventory-allocations/check-availability')
  @ApiOperation({ summary: 'Check inventory availability' })
  @ApiOkResponse({ type: CheckAvailabilityResultDto })
  @CheckAbility({ action: WmsAction.Read, subject: 'InventoryAllocation' })
  async checkAvailability(@Req() req: any, @Body() dto: CheckAvailabilityDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.checkAvailability(tenantId, BigInt(dto.facility_id), BigInt(dto.product_id), dto.required_qty);
  }

  @Get('outbound/orders/:id/allocations')
  @ApiOperation({ summary: 'Get allocations for a sales order' })
  @ApiOkResponse({ type: [AllocationRecordDto] })
  @CheckAbility({ action: WmsAction.Read, subject: 'InventoryAllocation' })
  async findByOrderId(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findByOrderId(tenantId, id);
  }

}
