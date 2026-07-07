import { Controller, Delete, Get, Post, Patch, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { CarrierService } from '../carrier.service';
import { CarrierResponseDto, CreateCarrierDto, UpdateCarrierDto } from '../dtos/carrier-response.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Carriers')
@Controller('web/carriers')
export class CarrierController {
  constructor(private readonly carrierService: CarrierService) {}

  @Post() @ApiOperation({ summary: 'Create carrier' })
  @ApiCreatedResponse({ type: CarrierResponseDto })
  async create(@Req() req: any, @Body() dto: CreateCarrierDto) {
    return this.carrierService.create(req.tenantContext.getTenantId(), dto);
  }
  @Get() @ApiOperation({ summary: 'List carriers' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.carrierService.findAll(req.tenantContext.getTenantId(), query);
  }
  @Get(':id') @ApiOperation({ summary: 'Get carrier' })
  @ApiOkResponse({ type: CarrierResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.carrierService.findById(req.tenantContext.getTenantId(), BigInt(id));
  }
  @Patch(':id') @ApiOperation({ summary: 'Update carrier' })
  @ApiOkResponse({ type: CarrierResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCarrierDto) {
    return this.carrierService.update(req.tenantContext.getTenantId(), BigInt(id), dto);
  }
  @Delete(':id') @ApiOperation({ summary: 'Delete carrier' })
  @ApiOkResponse({ type: CarrierResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.carrierService.delete(req.tenantContext.getTenantId(), BigInt(id));
  }
}
