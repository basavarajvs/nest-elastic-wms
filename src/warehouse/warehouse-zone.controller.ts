import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { WarehouseZoneService } from './warehouse-zone.service';
import { CreateZoneDto } from './dtos/create-zone.dto';
import { UpdateZoneDto } from './dtos/update-zone.dto';
import { CheckAbility } from '../common/decorators/check-ability.decorator';
import { CaslGuard } from '../common/guards/casl.guard';
import { RfSessionGuard } from '../common/guards/rf-session.guard';
import { RfAction } from '../common/guards/rf-action.decorator';

@ApiTags('Master-Data', 'WMS-WEB')
@Controller()
export class WarehouseZoneController {
  constructor(private readonly zoneService: WarehouseZoneService) {}

  @Post('web/zones')
  @UseGuards(CaslGuard)
  @CheckAbility({ action: 'create', subject: 'WarehouseZone' })
  async create(@Req() req: any, @Body() dto: CreateZoneDto) {
    return this.zoneService.create(dto, req.tenantContext.getTenantId());
  }

  @Get('web/zones')
  @UseGuards(CaslGuard)
  @CheckAbility({ action: 'read', subject: 'WarehouseZone' })
  async findAllWeb(@Req() req: any, @Query('facilityId') facilityId?: string) {
    return this.zoneService.findAll(req.tenantContext.getTenantId(), facilityId);
  }

  @Get('web/zones/:id')
  @UseGuards(CaslGuard)
  @CheckAbility({ action: 'read', subject: 'WarehouseZone' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.zoneService.findById(id, req.tenantContext.getTenantId());
  }

  @Patch('web/zones/:id')
  @UseGuards(CaslGuard)
  @CheckAbility({ action: 'update', subject: 'WarehouseZone' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateZoneDto) {
    return this.zoneService.update(id, req.tenantContext.getTenantId(), dto);
  }

  @Delete('web/zones/:id')
  @UseGuards(CaslGuard)
  @CheckAbility({ action: 'delete', subject: 'WarehouseZone' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.zoneService.delete(id, req.tenantContext.getTenantId());
    return { success: true };
  }

  @Get('rf/zones')
  @UseGuards(RfSessionGuard)
  @RfAction('read')
  async findAllRf(@Req() req: any, @Query('facilityId') facilityId?: string) {
    const zones = await this.zoneService.findAll(req.tenantContext.getTenantId(), facilityId);
    return zones.map((z: any) => ({
      id: z.id,
      zoneCode: z.zoneCode,
      name: z.name,
      zoneType: z.zoneType,
      isActive: z.isActive,
    }));
  }
}
