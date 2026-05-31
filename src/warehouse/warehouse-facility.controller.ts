import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { WarehouseFacilityService } from './warehouse-facility.service';
import { CreateFacilityDto } from './dtos/create-facility.dto';
import { UpdateFacilityDto } from './dtos/update-facility.dto';
import { CheckAbility } from '../common/decorators/check-ability.decorator';
import { CaslGuard } from '../common/guards/casl.guard';
import { RfSessionGuard } from '../common/guards/rf-session.guard';
import { RfAction } from '../common/guards/rf-action.decorator';

@ApiTags('Master-Data', 'WMS-WEB')
@Controller()
export class WarehouseFacilityController {
  constructor(private readonly facilityService: WarehouseFacilityService) {}

  @Post('web/facilities')
  @UseGuards(CaslGuard)
  @CheckAbility({ action: 'create', subject: 'WarehouseFacility' })
  async create(@Req() req: any, @Body() dto: CreateFacilityDto) {
    return this.facilityService.create(dto, req.tenantContext.getTenantId());
  }

  @Get('web/facilities')
  @UseGuards(CaslGuard)
  @CheckAbility({ action: 'read', subject: 'WarehouseFacility' })
  async findAllWeb(@Req() req: any) {
    return this.facilityService.findAll(req.tenantContext.getTenantId());
  }

  @Get('web/facilities/:id')
  @UseGuards(CaslGuard)
  @CheckAbility({ action: 'read', subject: 'WarehouseFacility' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.facilityService.findById(id, req.tenantContext.getTenantId());
  }

  @Patch('web/facilities/:id')
  @UseGuards(CaslGuard)
  @CheckAbility({ action: 'update', subject: 'WarehouseFacility' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateFacilityDto) {
    return this.facilityService.update(id, req.tenantContext.getTenantId(), dto);
  }

  @Delete('web/facilities/:id')
  @UseGuards(CaslGuard)
  @CheckAbility({ action: 'delete', subject: 'WarehouseFacility' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.facilityService.delete(id, req.tenantContext.getTenantId());
    return { success: true };
  }

  @Get('rf/facilities')
  @UseGuards(RfSessionGuard)
  @RfAction('read')
  async findAllRf(@Req() req: any) {
    const facilities = await this.facilityService.findAll(req.tenantContext.getTenantId());
    return facilities.map((f: any) => ({
      id: f.id,
      facilityCode: f.facilityCode,
      name: f.name,
      isActive: f.isActive,
    }));
  }
}
