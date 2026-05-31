import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { PackingStationsService } from '../packing-stations.service';
import { CreatePackingStationDto, UpdatePackingStationDto } from '../dtos/create-packing-station.dto';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/packing-stations')
@UseGuards(CaslGuard)
export class PackingStationsWebController {
  constructor(private readonly packingStationsService: PackingStationsService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'PackingStation' })
  @ApiOperation({ summary: 'Create a packing station' })
  async create(@Body() dto: CreatePackingStationDto, @Req() req: any) {
    return this.packingStationsService.create(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'PackingStation' })
  @ApiOperation({ summary: 'List all packing stations' })
  async findAll(@Req() req: any) {
    return this.packingStationsService.findAll(req.tenantContext.getTenantId());
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'PackingStation' })
  @ApiOperation({ summary: 'Get packing station by ID' })
  async findById(@Param('id') id: string, @Req() req: any) {
    return this.packingStationsService.findById(id, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'PackingStation' })
  @ApiOperation({ summary: 'Update a packing station' })
  async update(@Param('id') id: string, @Body() dto: UpdatePackingStationDto, @Req() req: any) {
    return this.packingStationsService.update(id, dto, req.tenantContext.getTenantId());
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'PackingStation' })
  @ApiOperation({ summary: 'Delete a packing station' })
  async delete(@Param('id') id: string, @Req() req: any) {
    await this.packingStationsService.delete(id, req.tenantContext.getTenantId());
    return { deleted: true };
  }
}
