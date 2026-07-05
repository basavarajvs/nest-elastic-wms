import { Controller, Delete, Get, Post, Patch, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CarrierService } from '../carrier.service';

@ApiTags('Carriers')
@Controller('web/carriers')
export class CarrierController {
  constructor(private readonly carrierService: CarrierService) {}

  @Post() @ApiOperation({ summary: 'Create carrier' })
  async create(@Req() req: any, @Body() dto: any) {
    return this.carrierService.create(req.tenantContext.getTenantId(), dto);
  }
  @Get() @ApiOperation({ summary: 'List carriers' })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.carrierService.findAll(req.tenantContext.getTenantId(), query);
  }
  @Get(':id') @ApiOperation({ summary: 'Get carrier' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.carrierService.findById(req.tenantContext.getTenantId(), BigInt(id));
  }
  @Patch(':id') @ApiOperation({ summary: 'Update carrier' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.carrierService.update(req.tenantContext.getTenantId(), BigInt(id), dto);
  }
  @Delete(':id') @ApiOperation({ summary: 'Delete carrier' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.carrierService.delete(req.tenantContext.getTenantId(), BigInt(id));
  }
}
