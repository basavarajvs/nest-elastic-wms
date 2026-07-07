import { Controller, Delete, Get, Post, Patch, Param, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { UomService } from '../uom.service';
import { UomResponseDto, CreateUomDto, UpdateUomDto } from '../dtos/uom-response.dto';

@ApiTags('Units of Measure')
@Controller('web/units-of-measure')
export class UomController {
  constructor(private readonly uomService: UomService) {}

  @Post() @ApiOperation({ summary: 'Create UOM' })
  @ApiCreatedResponse({ type: UomResponseDto })
  async create(@Req() req: any, @Body() dto: CreateUomDto) {
    return this.uomService.create(req.tenantContext.getTenantId(), dto);
  }
  @Get() @ApiOperation({ summary: 'List UOMs' })
  @ApiOkResponse({ type: UomResponseDto, isArray: true })
  async findAll(@Req() req: any) {
    return this.uomService.findAll(req.tenantContext.getTenantId());
  }
  @Get(':id') @ApiOperation({ summary: 'Get UOM' })
  @ApiOkResponse({ type: UomResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.uomService.findById(req.tenantContext.getTenantId(), BigInt(id));
  }
  @Patch(':id') @ApiOperation({ summary: 'Update UOM' })
  @ApiOkResponse({ type: UomResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateUomDto) {
    return this.uomService.update(req.tenantContext.getTenantId(), BigInt(id), dto);
  }
  @Delete(':id') @ApiOperation({ summary: 'Delete UOM' })
  @ApiOkResponse({ type: UomResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.uomService.delete(req.tenantContext.getTenantId(), BigInt(id));
  }
}
