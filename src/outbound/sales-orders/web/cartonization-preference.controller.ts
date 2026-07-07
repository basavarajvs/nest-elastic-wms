import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { CartonizationPreferenceService } from '../cartonization-preference.service';
import {
  CartonizationPreferenceDto, CartonizationPreferencePaginatedResponseDto,
  CreateCartonizationPreferenceDto, UpdateCartonizationPreferenceDto,
} from '../dtos/response.dto';
import { DeleteResultDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Outbound - Cartonization Preferences')
@Controller('web/cartonization-preferences')
export class CartonizationPreferenceWebController {
  constructor(private readonly service: CartonizationPreferenceService) {}

  @Post()
  @ApiOperation({ summary: 'Create cartonization preference' })
  @ApiCreatedResponse({ type: CartonizationPreferenceDto })
  async create(@Req() req: any, @Body() dto: CreateCartonizationPreferenceDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List cartonization preferences' })
  @ApiOkResponse({ type: CartonizationPreferencePaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cartonization preference by ID' })
  @ApiOkResponse({ type: CartonizationPreferenceDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update cartonization preference' })
  @ApiOkResponse({ type: CartonizationPreferenceDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCartonizationPreferenceDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete cartonization preference' })
  @ApiOkResponse({ type: DeleteResultDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
