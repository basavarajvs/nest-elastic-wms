import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FacilityService } from '../facility.service';

@ApiTags('Warehouse Facilities')
@Controller('web/facilities')
export class FacilityController {
  constructor(private readonly facilityService: FacilityService) {}

  @Post()
  @ApiOperation({ summary: 'Create facility' })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.facilityService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List facilities' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.facilityService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get facility' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.facilityService.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update facility' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.facilityService.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete facility' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.facilityService.delete(tenantId, BigInt(id));
  }

  @Get(':id/hierarchy')
  @ApiOperation({ summary: 'Get facility hierarchy (zones → aisles → rack rows → levels → locations)' })
  async getHierarchy(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.facilityService.getHierarchy(tenantId, BigInt(id));
  }

  @Get('summary/all')
  @ApiOperation({ summary: 'Get summary of all facilities' })
  async getSummary(@Req() req: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.facilityService.getSummary(tenantId);
  }
}
