import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AisleService } from '../services/aisle.service';
import { CreateAisleDto, UpdateAisleDto } from '../dtos/hierarchy.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Master-Data')
@Controller('web/aisles')
@UseGuards(CaslGuard)
export class AisleController {
  constructor(private readonly aisleService: AisleService) {}

  @Get()
  @CheckAbility({ action: 'read', subject: 'StorageLocation' })
  @ApiOperation({ summary: 'List aisles (by zone)' })
  async list(@Req() req: any, @Query('zoneId') zoneId: string) {
    return this.aisleService.list(req.tenantContext.getTenantId(), zoneId);
  }

  @Post()
  @CheckAbility({ action: 'create', subject: 'StorageLocation' })
  @ApiOperation({ summary: 'Create aisle' })
  async create(@Req() req: any, @Body() dto: CreateAisleDto) {
    return this.aisleService.create(req.tenantContext.getTenantId(), dto.facilityId, dto.zoneId, dto.aisleCode, dto.name);
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'StorageLocation' })
  @ApiOperation({ summary: 'Update aisle' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateAisleDto) {
    return this.aisleService.update(id, req.tenantContext.getTenantId(), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'StorageLocation' })
  @ApiOperation({ summary: 'Delete aisle' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.aisleService.delete(id, req.tenantContext.getTenantId());
    return { success: true };
  }
}
