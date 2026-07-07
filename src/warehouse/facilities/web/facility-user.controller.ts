import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { CreateFacilityUserDto, UpdateFacilityUserDto, FacilityUserResponseDto } from '../dtos/facility.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { FacilityUserService } from '../facility-user.service';

@ApiTags('Facility User Assignments')
@Controller('web/facility-users')
export class FacilityUserController {
  constructor(private readonly service: FacilityUserService) {}

  @Post()
  @ApiOperation({ summary: 'Create facility user assignment' })
  @ApiCreatedResponse({ type: FacilityUserResponseDto })
  async create(@Req() req: any, @Body() dto: CreateFacilityUserDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List facility user assignments' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get facility user assignment' })
  @ApiOkResponse({ type: FacilityUserResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update facility user assignment' })
  @ApiOkResponse({ type: FacilityUserResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateFacilityUserDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete facility user assignment' })
  @ApiOkResponse({ type: FacilityUserResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
