import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LocationService } from '../location.service';

@ApiTags('Storage Locations')
@Controller('web/locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @ApiOperation({ summary: 'Create storage location' })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.locationService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List locations (requires facilityId query param)' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.locationService.findAll(tenantId, BigInt(query.facilityId), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get location by ID' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.locationService.findById(tenantId, BigInt(id));
  }

  @Get('barcode/:code')
  @ApiOperation({ summary: 'Lookup location by barcode' })
  async findByBarcode(@Req() req: any, @Param('code') code: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.locationService.findByBarcode(tenantId, code);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update location' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.locationService.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete location' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.locationService.delete(tenantId, BigInt(id));
  }

  @Get(':id/capacity')
  @ApiOperation({ summary: 'Get location capacity/utilization' })
  async getCapacity(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.locationService.getCapacity(tenantId, BigInt(id));
  }

  @Get('available/list')
  @ApiOperation({ summary: 'Find available locations in a facility' })
  async findAvailable(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.locationService.findAvailable(tenantId, BigInt(query.facilityId), query.locationType);
  }
}
