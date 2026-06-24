import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { VasCatalogService } from '../vas-catalog.service';
import { CreateVasServiceDto, UpdateVasServiceDto, SetClientRateDto, CreateWorkstationDto, UpdateWorkstationDto } from '../dtos/catalog.dto';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/vas')
@UseGuards(CaslGuard)
export class VasCatalogWebController {
  constructor(private readonly service: VasCatalogService) {}

  @Post('services')
  @CheckAbility({ action: 'create', subject: 'VasServiceCatalog' })
  @ApiOperation({ summary: 'Create a VAS service' })
  async createService(@Body() dto: CreateVasServiceDto, @Req() req: any) {
    return this.service.createService(dto, req.tenantContext.getTenantId());
  }

  @Get('services')
  @CheckAbility({ action: 'read', subject: 'VasServiceCatalog' })
  @ApiOperation({ summary: 'List VAS service catalog' })
  async listServices(@Req() req: any, @Query('category') category: string, @Query('isActive') isActive: string) {
    return this.service.listServices(req.tenantContext.getTenantId(), { category, isActive });
  }

  @Patch('services/:id')
  @CheckAbility({ action: 'update', subject: 'VasServiceCatalog' })
  @ApiOperation({ summary: 'Update a VAS service' })
  async updateService(@Param('id') id: string, @Body() dto: UpdateVasServiceDto, @Req() req: any) {
    return this.service.updateService(id, dto, req.tenantContext.getTenantId());
  }

  @Post('client-rates')
  @CheckAbility({ action: 'create', subject: 'VasServiceCatalog' })
  @ApiOperation({ summary: 'Set a client-specific rate' })
  async setClientRate(@Body() dto: SetClientRateDto, @Req() req: any) {
    return this.service.setClientRate(dto, req.tenantContext.getTenantId());
  }

  @Get('client-rates')
  @CheckAbility({ action: 'read', subject: 'VasServiceCatalog' })
  @ApiOperation({ summary: 'List client rates' })
  async listClientRates(@Req() req: any, @Query('serviceId') serviceId: string, @Query('clientId') clientId: string) {
    return this.service.listClientRates(req.tenantContext.getTenantId(), { serviceId, clientId });
  }

  @Post('workstations')
  @CheckAbility({ action: 'create', subject: 'VasWorkstation' })
  @ApiOperation({ summary: 'Create a VAS workstation' })
  async createWorkstation(@Body() dto: CreateWorkstationDto, @Req() req: any) {
    return this.service.createWorkstation(dto, req.tenantContext.getTenantId());
  }

  @Get('workstations')
  @CheckAbility({ action: 'read', subject: 'VasWorkstation' })
  @ApiOperation({ summary: 'List VAS workstations' })
  async listWorkstations(@Req() req: any, @Query('facilityId') facilityId: string, @Query('stationType') stationType: string, @Query('isAvailable') isAvailable: string) {
    return this.service.listWorkstations(req.tenantContext.getTenantId(), { facilityId, stationType, isAvailable });
  }

  @Get('workstations/:id')
  @CheckAbility({ action: 'read', subject: 'VasWorkstation' })
  @ApiOperation({ summary: 'Get a VAS workstation by ID' })
  async getWorkstation(@Param('id') id: string, @Req() req: any) {
    return this.service.getWorkstation(id, req.tenantContext.getTenantId());
  }

  @Patch('workstations/:id')
  @CheckAbility({ action: 'update', subject: 'VasWorkstation' })
  @ApiOperation({ summary: 'Update a VAS workstation' })
  async updateWorkstation(@Param('id') id: string, @Body() dto: UpdateWorkstationDto, @Req() req: any) {
    return this.service.updateWorkstation(id, dto, req.tenantContext.getTenantId());
  }
}
