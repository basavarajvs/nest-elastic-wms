import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { CreateFacilityDto, UpdateFacilityDto, FacilityResponseDto, FacilityHierarchyDto, FacilitySummaryDto } from '../dtos/facility.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { FacilityService } from '../facility.service';

@ApiTags('Warehouse Facilities')
@Controller('web/facilities')
export class FacilityController {
  constructor(private readonly facilityService: FacilityService) {}

  @Post()
  @ApiOperation({ summary: 'Create facility' })
  @ApiCreatedResponse({ type: FacilityResponseDto })
  async create(@Req() req: any, @Body() dto: CreateFacilityDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.facilityService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List facilities' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.facilityService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get facility' })
  @ApiOkResponse({ type: FacilityResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.facilityService.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update facility' })
  @ApiOkResponse({ type: FacilityResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateFacilityDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.facilityService.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete facility' })
  @ApiOkResponse({ type: FacilityResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.facilityService.delete(tenantId, BigInt(id));
  }

  @Get(':id/hierarchy')
  @ApiOperation({ summary: 'Get facility hierarchy (zones → aisles → rack rows → levels → locations)' })
  @ApiOkResponse({ type: FacilityHierarchyDto })
  async getHierarchy(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.facilityService.getHierarchy(tenantId, BigInt(id));
  }

  @Get('summary/all')
  @ApiOperation({ summary: 'Get summary of all facilities' })
  @ApiOkResponse({ type: FacilitySummaryDto })
  async getSummary(@Req() req: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.facilityService.getSummary(tenantId);
  }
}
