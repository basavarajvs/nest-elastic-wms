import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { BayService } from '../services/bay.service';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Master-Data')
@Controller('web/bays')
@UseGuards(CaslGuard)
export class BayController {
  constructor(private readonly bayService: BayService) {}

  @Get()
  @CheckAbility({ action: 'read', subject: 'StorageLocation' })
  @ApiOperation({ summary: 'List bays (by aisle)' })
  async list(@Req() req: any, @Query('aisleId') aisleId: string) {
    return this.bayService.list(req.tenantContext.getTenantId(), aisleId);
  }

  @Post()
  @CheckAbility({ action: 'create', subject: 'StorageLocation' })
  @ApiOperation({ summary: 'Create bay' })
  async create(@Req() req: any, @Body() body: { facilityId: string; zoneId: string; aisleId: string; bayCode: string; name?: string }) {
    return this.bayService.create(req.tenantContext.getTenantId(), body.facilityId, body.zoneId, body.aisleId, body.bayCode, body.name);
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'StorageLocation' })
  @ApiOperation({ summary: 'Update bay' })
  async update(@Req() req: any, @Param('id') id: string, @Body() body: { bayCode?: string; name?: string; isActive?: boolean }) {
    return this.bayService.update(id, req.tenantContext.getTenantId(), body);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'StorageLocation' })
  @ApiOperation({ summary: 'Delete bay' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.bayService.delete(id, req.tenantContext.getTenantId());
    return { success: true };
  }
}
