import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { ComplianceService } from '../compliance/compliance.service';

@ApiTags('Quality')
@Controller('web/compliance-requirements')
@UseGuards(JwtAuthGuard, CaslGuard)
export class ComplianceRequirementController {
  constructor(private readonly service: ComplianceService) {}

  @Post()
  @CheckAbility({ action: WmsAction.Create, subject: 'ComplianceRequirement' })
  @AuditLog({ eventType: 'COMPLIANCE_REQ_CREATE' })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.createRequirement(tenantId, dto);
  }

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'ComplianceRequirement' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAllRequirements(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'ComplianceRequirement' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findRequirementById(tenantId, id);
  }

  @Patch(':id')
  @CheckAbility({ action: WmsAction.Update, subject: 'ComplianceRequirement' })
  @AuditLog({ eventType: 'COMPLIANCE_REQ_UPDATE' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.updateRequirement(tenantId, id, dto);
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'ComplianceRequirement' })
  @AuditLog({ eventType: 'COMPLIANCE_REQ_DELETE' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.deleteRequirement(tenantId, id);
  }
}

@ApiTags('Quality')
@Controller('web/compliance-audits')
@UseGuards(JwtAuthGuard, CaslGuard)
export class ComplianceAuditController {
  constructor(private readonly service: ComplianceService) {}

  @Post()
  @CheckAbility({ action: WmsAction.Create, subject: 'ComplianceAudit' })
  @AuditLog({ eventType: 'COMPLIANCE_AUDIT_CREATE' })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.createAudit(tenantId, dto);
  }

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'ComplianceAudit' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAllAudits(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'ComplianceAudit' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAuditById(tenantId, id);
  }

  @Patch(':id')
  @CheckAbility({ action: WmsAction.Update, subject: 'ComplianceAudit' })
  @AuditLog({ eventType: 'COMPLIANCE_AUDIT_UPDATE' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.updateAudit(tenantId, id, dto);
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'ComplianceAudit' })
  @AuditLog({ eventType: 'COMPLIANCE_AUDIT_DELETE' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.deleteAudit(tenantId, id);
  }
}

@ApiTags('Quality')
@Controller('web/hazmat-materials')
@UseGuards(JwtAuthGuard, CaslGuard)
export class HazmatController {
  constructor(private readonly service: ComplianceService) {}

  @Post()
  @CheckAbility({ action: WmsAction.Create, subject: 'HazmatMaterial' })
  @AuditLog({ eventType: 'HAZMAT_CREATE' })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.createHazmat(tenantId, dto);
  }

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'HazmatMaterial' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAllHazmat(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'HazmatMaterial' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findHazmatById(tenantId, id);
  }

  @Patch(':id')
  @CheckAbility({ action: WmsAction.Update, subject: 'HazmatMaterial' })
  @AuditLog({ eventType: 'HAZMAT_UPDATE' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.updateHazmat(tenantId, id, dto);
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'HazmatMaterial' })
  @AuditLog({ eventType: 'HAZMAT_DELETE' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.deleteHazmat(tenantId, id);
  }
}
