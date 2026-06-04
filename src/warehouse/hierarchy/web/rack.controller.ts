import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { RackService } from '../services/rack.service';
import { CreateRackDto, UpdateRackDto } from '../dtos/hierarchy.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Master-Data')
@Controller('web/racks')
@UseGuards(CaslGuard)
export class RackController {
  constructor(private readonly rackService: RackService) {}

  @Get()
  @CheckAbility({ action: 'read', subject: 'StorageLocation' })
  @ApiOperation({ summary: 'List racks (by bay)' })
  async list(@Req() req: any, @Query('bayId') bayId: string) {
    return this.rackService.list(req.tenantContext.getTenantId(), bayId);
  }

  @Post()
  @CheckAbility({ action: 'create', subject: 'StorageLocation' })
  @ApiOperation({ summary: 'Create rack' })
  async create(@Req() req: any, @Body() dto: CreateRackDto) {
    return this.rackService.create(req.tenantContext.getTenantId(), dto.facilityId, dto.zoneId, dto.aisleId, dto.bayId, dto.rackCode, dto.name);
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'StorageLocation' })
  @ApiOperation({ summary: 'Update rack' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateRackDto) {
    return this.rackService.update(id, req.tenantContext.getTenantId(), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'StorageLocation' })
  @ApiOperation({ summary: 'Delete rack' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.rackService.delete(id, req.tenantContext.getTenantId());
    return { success: true };
  }
}
