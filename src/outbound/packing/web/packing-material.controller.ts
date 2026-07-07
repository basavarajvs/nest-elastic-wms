import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { PackingMaterialService } from '../packing-material.service';
import {
  PackingMaterialDto, PackingMaterialPaginatedResponseDto,
  CreatePackingMaterialDto, UpdatePackingMaterialDto,
} from '../dtos/response.dto';
import { DeleteResultDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Outbound - Packing Materials')
@Controller('web/packing-materials')
export class PackingMaterialWebController {
  constructor(private readonly service: PackingMaterialService) {}

  @Post()
  @ApiOperation({ summary: 'Create packing material' })
  @ApiCreatedResponse({ type: PackingMaterialDto })
  async create(@Req() req: any, @Body() dto: CreatePackingMaterialDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List packing materials' })
  @ApiOkResponse({ type: PackingMaterialPaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get packing material by ID' })
  @ApiOkResponse({ type: PackingMaterialDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update packing material' })
  @ApiOkResponse({ type: PackingMaterialDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdatePackingMaterialDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete packing material' })
  @ApiOkResponse({ type: DeleteResultDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
