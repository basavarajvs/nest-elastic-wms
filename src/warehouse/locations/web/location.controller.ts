import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { LocationResponseDto, LocationCapacityDto, CreateLocationDto, UpdateLocationDto } from '../dtos/location.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { LocationService } from '../location.service';

@ApiTags('Storage Locations')
@Controller('web/locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @ApiOperation({ summary: 'Create storage location' })
  @ApiCreatedResponse({ type: LocationResponseDto })
  async create(@Req() req: any, @Body() dto: CreateLocationDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.locationService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List locations (requires facilityId query param)' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.locationService.findAll(tenantId, query.facilityId ? BigInt(query.facilityId) : (undefined as any), query);
  }

  @Get('lookup')
  @ApiOperation({ summary: 'Lightweight location lookup for dropdown filters' })
  @ApiOkResponse({ type: Object })
  async lookup(@Req() req: any, @Query('facilityId') facilityId?: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.locationService.findLookup(tenantId, facilityId ? BigInt(facilityId) : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get location by ID' })
  @ApiOkResponse({ type: LocationResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.locationService.findById(tenantId, BigInt(id));
  }

  @Get('barcode/:code')
  @ApiOperation({ summary: 'Lookup location by barcode' })
  @ApiOkResponse({ type: LocationResponseDto })
  async findByBarcode(@Req() req: any, @Param('code') code: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.locationService.findByBarcode(tenantId, code);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update location' })
  @ApiOkResponse({ type: LocationResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateLocationDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.locationService.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete location' })
  @ApiOkResponse({ type: LocationResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.locationService.delete(tenantId, BigInt(id));
  }

  @Get(':id/capacity')
  @ApiOperation({ summary: 'Get location capacity/utilization' })
  @ApiOkResponse({ type: LocationCapacityDto })
  async getCapacity(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.locationService.getCapacity(tenantId, BigInt(id));
  }

  @Get('available/list')
  @ApiOperation({ summary: 'Find available locations in a facility' })
  @ApiOkResponse({ type: LocationResponseDto, isArray: true })
  async findAvailable(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.locationService.findAvailable(tenantId, query.facilityId ? BigInt(query.facilityId) : (undefined as any), query.locationType);
  }
}
