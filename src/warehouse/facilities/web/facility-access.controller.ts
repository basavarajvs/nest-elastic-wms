import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { CreateFacilityAccessDto, UpdateFacilityAccessDto, FacilityAccessResponseDto } from '../dtos/facility.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { FacilityAccessService } from '../facility-access.service';

@ApiTags('Facility Access Control')
@Controller('web/facility-access')
export class FacilityAccessController {
  constructor(private readonly service: FacilityAccessService) {}

  @Post()
  @ApiOperation({ summary: 'Create facility access control record' })
  @ApiCreatedResponse({ type: FacilityAccessResponseDto })
  async create(@Req() req: any, @Body() dto: CreateFacilityAccessDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List facility access control records' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get facility access control record' })
  @ApiOkResponse({ type: FacilityAccessResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update facility access control record' })
  @ApiOkResponse({ type: FacilityAccessResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateFacilityAccessDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete facility access control record' })
  @ApiOkResponse({ type: FacilityAccessResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
