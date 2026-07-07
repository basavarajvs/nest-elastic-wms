import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { PackingStationService } from '../packing-station.service';
import {
  PackingStationResponseDto, PackingStationPaginatedResponseDto,
  CreatePackingStationDto, UpdatePackingStationDto,
} from '../dtos/response.dto';
import { DeleteResultDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Outbound - Packing Stations')
@Controller('web/packing-stations')
export class PackingStationWebController {
  constructor(private readonly service: PackingStationService) {}

  @Post()
  @ApiOperation({ summary: 'Create packing station' })
  @ApiCreatedResponse({ type: PackingStationResponseDto })
  async create(@Req() req: any, @Body() dto: CreatePackingStationDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List packing stations' })
  @ApiOkResponse({ type: PackingStationPaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get packing station by ID' })
  @ApiOkResponse({ type: PackingStationResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update packing station' })
  @ApiOkResponse({ type: PackingStationResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdatePackingStationDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete packing station' })
  @ApiOkResponse({ type: DeleteResultDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
