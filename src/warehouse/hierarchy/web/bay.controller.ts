import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { BayService } from '../services/bay.service';
import { CreateBayDto, UpdateBayDto } from '../dtos/hierarchy.dto';
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
  async create(@Req() req: any, @Body() dto: CreateBayDto) {
    return this.bayService.create(req.tenantContext.getTenantId(), dto.facilityId, dto.zoneId, dto.aisleId, dto.bayCode, dto.name);
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'StorageLocation' })
  @ApiOperation({ summary: 'Update bay' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateBayDto) {
    return this.bayService.update(id, req.tenantContext.getTenantId(), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'StorageLocation' })
  @ApiOperation({ summary: 'Delete bay' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.bayService.delete(id, req.tenantContext.getTenantId());
    return { success: true };
  }
}
