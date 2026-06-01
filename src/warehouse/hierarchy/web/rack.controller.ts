import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { RackService } from '../services/rack.service';
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
  async create(@Req() req: any, @Body() body: { facilityId: string; zoneId: string; aisleId: string; bayId: string; rackCode: string; name?: string }) {
    return this.rackService.create(req.tenantContext.getTenantId(), body.facilityId, body.zoneId, body.aisleId, body.bayId, body.rackCode, body.name);
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'StorageLocation' })
  @ApiOperation({ summary: 'Update rack' })
  async update(@Req() req: any, @Param('id') id: string, @Body() body: { rackCode?: string; name?: string; isActive?: boolean }) {
    return this.rackService.update(id, req.tenantContext.getTenantId(), body);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'StorageLocation' })
  @ApiOperation({ summary: 'Delete rack' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.rackService.delete(id, req.tenantContext.getTenantId());
    return { success: true };
  }
}
