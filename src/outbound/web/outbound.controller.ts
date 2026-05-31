import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { OrderService } from '../order.service';
import { AllocationService } from '../allocation.service';
import { AllocationOverrideGuard } from '../allocation-override.guard';
import { WaveService } from '../wave.service';
import { PackingService } from '../packing.service';
import { ShippingService } from '../shipping.service';
import { CreateOrderDto } from '../dtos/order.dto';
import { CreateWaveDto } from '../dtos/wave.dto';
import { GenerateManifestDto } from '../dtos/shipping.dto';
import { AllocationOverrideDto } from '../dtos/allocation.dto';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { QuotaCheck } from '../../common/decorators/quota-check.decorator';
import { CaslGuard } from '../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/outbound')
@UseGuards(CaslGuard)
export class OutboundWebController {
  constructor(
    private readonly orderService: OrderService,
    private readonly allocationService: AllocationService,
    private readonly waveService: WaveService,
    private readonly packingService: PackingService,
    private readonly shippingService: ShippingService,
    private readonly allocationOverrideGuard: AllocationOverrideGuard,
  ) {}

  @Post('/orders')
  @QuotaCheck('outbound_orders')
  @CheckAbility({ action: 'create', subject: 'SalesOrder' })
  async createOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.orderService.create(dto, req.tenantContext.getTenantId());
  }

  @Get('/orders')
  @CheckAbility({ action: 'read', subject: 'SalesOrder' })
  async listOrders(
    @Req() req: any,
    @Query('status') status: string,
    @Query('clientCode') clientCode: string,
    @Query('facilityId') facilityId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.orderService.list(req.tenantContext.getTenantId(), { status, clientCode, facilityId, page, limit });
  }

  @Get('/allocations/pending')
  @CheckAbility({ action: 'read', subject: 'InventoryAllocation' })
  async getPendingAllocations(@Req() req: any, @Query('facilityId') facilityId: string) {
    return this.allocationService.getPendingSoftAllocations(req.tenantContext.getTenantId(), facilityId);
  }

  @Post('/waves')
  @CheckAbility({ action: 'create', subject: 'PickingWave' })
  async createWave(@Req() req: any, @Body() dto: CreateWaveDto) {
    return this.waveService.create(dto, req.tenantContext.getTenantId());
  }

  @Get('/waves/board')
  @CheckAbility({ action: 'read', subject: 'PickingWave' })
  async getWaveBoard(
    @Req() req: any,
    @Query('status') status: string,
    @Query('facilityId') facilityId: string,
  ) {
    return this.waveService.getBoard(req.tenantContext.getTenantId(), { status, facilityId });
  }

  @Post('/shipments/generate-manifest')
  @CheckAbility({ action: 'update', subject: 'OutboundShipment' })
  async generateManifest(@Req() req: any, @Body() dto: GenerateManifestDto) {
    return this.shippingService.generateManifest(dto.shipmentId, req.tenantContext.getTenantId());
  }

  @Post('/allocations/override')
  @UseGuards(AllocationOverrideGuard)
  @CheckAbility({ action: 'approve', subject: 'InventoryAllocation' })
  async overrideAllocation(@Req() req: any, @Body() dto: AllocationOverrideDto) {
    return this.allocationService.overrideAllocation(dto, req.tenantContext.getTenantId());
  }
}
