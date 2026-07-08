import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { PickingWaveService } from '../picking-wave.service';
import { AllocationService } from '../../allocation/allocation.service';
import { PickingWaveDto, PickingWavePaginatedResponseDto, PickingWaveDetailDto, WaveOrderDto, CreatePickingWaveDto, UpdatePickingWaveDto } from '../dtos/response.dto';
import { DeleteResultDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Outbound - Picking Waves')
@Controller('web/picking-waves')
export class PickingWaveWebController {
  constructor(
    private readonly service: PickingWaveService,
    private readonly allocationService: AllocationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create picking wave from selected orders' })
  @ApiCreatedResponse({ type: PickingWaveDetailDto })
  async create(@Req() req: any, @Body() dto: CreatePickingWaveDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.createWave(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List picking waves' })
  @ApiOkResponse({ type: PickingWavePaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAllWaves(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get wave with orders and tasks' })
  @ApiOkResponse({ type: PickingWaveDetailDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findWaveById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update wave metadata (only PENDING waves)' })
  @ApiOkResponse({ type: PickingWaveDetailDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdatePickingWaveDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.updateWave(tenantId, BigInt(id), dto);
  }

  @Post(':id/release')
  @ApiOperation({ summary: 'Release wave — allocate inventory + generate pick tasks' })
  @ApiCreatedResponse({ type: PickingWaveDetailDto })
  async release(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.releaseWave(tenantId, BigInt(id), this.allocationService);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel picking wave — revert orders, cancel tasks, release allocations' })
  @ApiCreatedResponse({ type: PickingWaveDetailDto })
  async cancel(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.cancelWave(tenantId, BigInt(id));
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete picking wave' })
  @ApiCreatedResponse({ type: PickingWaveDetailDto })
  async complete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.completeWave(tenantId, BigInt(id));
  }

  @Get(':id/orders')
  @ApiOperation({ summary: 'Get orders in a wave' })
  @ApiOkResponse({ type: [WaveOrderDto] })
  async getOrders(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.getWaveOrders(tenantId, BigInt(id));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete picking wave' })
  @ApiOkResponse({ type: DeleteResultDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.deleteWave(tenantId, BigInt(id));
  }
}
