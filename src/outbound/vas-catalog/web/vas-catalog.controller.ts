import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../../common/decorators/audit-log.decorator';
import { VasCatalogService } from '../vas-catalog.service';

@ApiTags('Outbound - VAS Catalog')
@Controller('web/vas')
@UseGuards(JwtAuthGuard, CaslGuard)
export class VasCatalogWebController {
  constructor(private readonly service: VasCatalogService) {}

  @Post('services')
  @CheckAbility({ action: 'create', subject: 'VasService' })
  @AuditLog({ eventType: 'VAS_SERVICE_CREATED', detail: (req, body) => `Created VAS service ${body.vasCode}` })
  async createService(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.service.createService(tenantId, userId, dto);
  }

  @Get('services')
  @CheckAbility({ action: 'read', subject: 'VasService' })
  async findAllServices(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAllServices(tenantId, query);
  }

  @Get('services/:id')
  @CheckAbility({ action: 'read', subject: 'VasService' })
  async findServiceById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findServiceById(tenantId, BigInt(id));
  }

  @Patch('services/:id')
  @CheckAbility({ action: 'update', subject: 'VasService' })
  @AuditLog({ eventType: 'VAS_SERVICE_UPDATED', detail: (req, body) => `Updated VAS service ${req.params.id}` })
  async updateService(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.service.updateService(tenantId, BigInt(id), userId, dto);
  }

  @Delete('services/:id')
  @CheckAbility({ action: 'delete', subject: 'VasService' })
  @AuditLog({ eventType: 'VAS_SERVICE_DELETED', detail: (req) => `Deleted VAS service ${req.params.id}` })
  async deleteService(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.deleteService(tenantId, BigInt(id));
  }

  @Post('client-rates')
  @CheckAbility({ action: 'create', subject: 'VasClientRate' })
  @AuditLog({ eventType: 'VAS_CLIENT_RATE_CREATED', detail: (req, body) => `Created client rate for ${body.serviceCode}` })
  async createClientRate(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.createClientRate(tenantId, dto);
  }

  @Get('client-rates')
  @CheckAbility({ action: 'read', subject: 'VasClientRate' })
  async findAllClientRates(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAllClientRates(tenantId, query);
  }

  @Post('workstations')
  @CheckAbility({ action: 'create', subject: 'VasWorkstation' })
  @AuditLog({ eventType: 'VAS_WORKSTATION_CREATED', detail: (req, body) => `Created workstation ${body.workstationCode}` })
  async createWorkstation(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.service.createWorkstation(tenantId, userId, dto);
  }

  @Get('workstations')
  @CheckAbility({ action: 'read', subject: 'VasWorkstation' })
  async findAllWorkstations(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAllWorkstations(tenantId, query);
  }

  @Get('workstations/:id')
  @CheckAbility({ action: 'read', subject: 'VasWorkstation' })
  async findWorkstationById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findWorkstationById(tenantId, BigInt(id));
  }

  @Patch('workstations/:id')
  @CheckAbility({ action: 'update', subject: 'VasWorkstation' })
  @AuditLog({ eventType: 'VAS_WORKSTATION_UPDATED', detail: (req) => `Updated workstation ${req.params.id}` })
  async updateWorkstation(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.service.updateWorkstation(tenantId, BigInt(id), userId, dto);
  }
}
