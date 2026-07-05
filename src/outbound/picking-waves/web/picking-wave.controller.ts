import { Controller, Get, Post, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PickingWaveService } from '../picking-wave.service';
import { AllocationService } from '../../allocation/allocation.service';

@ApiTags('Outbound - Picking Waves')
@Controller('web/picking-waves')
export class PickingWaveWebController {
  constructor(
    private readonly service: PickingWaveService,
    private readonly allocationService: AllocationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create picking wave from selected orders' })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.createWave(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List picking waves' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAllWaves(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get wave with orders and tasks' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findWaveById(tenantId, BigInt(id));
  }

  @Post(':id/release')
  @ApiOperation({ summary: 'Release wave — allocate inventory + generate pick tasks' })
  async release(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.releaseWave(tenantId, BigInt(id), this.allocationService);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete picking wave' })
  async complete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.completeWave(tenantId, BigInt(id));
  }

  @Get(':id/orders')
  @ApiOperation({ summary: 'Get orders in a wave' })
  async getOrders(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.getWaveOrders(tenantId, BigInt(id));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete picking wave' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.deleteWave(tenantId, BigInt(id));
  }
}
