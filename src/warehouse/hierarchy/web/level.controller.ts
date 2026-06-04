import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { LevelService } from '../services/level.service';
import { CreateLevelDto, UpdateLevelDto } from '../dtos/hierarchy.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Master-Data')
@Controller('web/levels')
@UseGuards(CaslGuard)
export class LevelController {
  constructor(private readonly levelService: LevelService) {}

  @Get()
  @CheckAbility({ action: 'read', subject: 'StorageLocation' })
  @ApiOperation({ summary: 'List levels (by rack)' })
  async list(@Req() req: any, @Query('rackId') rackId: string) {
    return this.levelService.list(req.tenantContext.getTenantId(), rackId);
  }

  @Post()
  @CheckAbility({ action: 'create', subject: 'StorageLocation' })
  @ApiOperation({ summary: 'Create level' })
  async create(@Req() req: any, @Body() dto: CreateLevelDto) {
    return this.levelService.create(req.tenantContext.getTenantId(), dto.facilityId, dto.zoneId, dto.aisleId, dto.bayId, dto.rackId, dto.levelCode, dto.name);
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'StorageLocation' })
  @ApiOperation({ summary: 'Update level' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateLevelDto) {
    return this.levelService.update(id, req.tenantContext.getTenantId(), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'StorageLocation' })
  @ApiOperation({ summary: 'Delete level' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.levelService.delete(id, req.tenantContext.getTenantId());
    return { success: true };
  }
}
