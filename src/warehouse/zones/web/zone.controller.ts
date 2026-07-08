import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { ZoneResponseDto, CreateZoneDto, UpdateZoneDto } from '../dtos/zone.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { ZoneService } from '../zone.service';

@ApiTags('Warehouse Zones')
@Controller('web/zones')
export class ZoneController {
  constructor(private readonly zoneService: ZoneService) {}

  @Post()
  @ApiOperation({ summary: 'Create zone' })
  @ApiCreatedResponse({ type: ZoneResponseDto })
  async create(@Req() req: any, @Body() dto: CreateZoneDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.zoneService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List zones by facility' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.zoneService.findAll(tenantId, query.facilityId ? BigInt(query.facilityId) : (undefined as any), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get zone by ID' })
  @ApiOkResponse({ type: ZoneResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.zoneService.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update zone' })
  @ApiOkResponse({ type: ZoneResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateZoneDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.zoneService.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete zone' })
  @ApiOkResponse({ type: ZoneResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.zoneService.delete(tenantId, BigInt(id));
  }
}
