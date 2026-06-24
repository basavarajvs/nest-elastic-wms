import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { ComplianceService } from '../compliance.service';
import { CreateRequirementDto, CreateAuditDto, UpdateAuditDto, CreateHazmatDto } from '../dtos/compliance.dto';

@ApiTags('WMS-WEB', 'Quality')
@Controller('web/compliance')
@UseGuards(CaslGuard)
export class ComplianceWebController {
  constructor(private readonly service: ComplianceService) {}

  @Post('requirements')
  @CheckAbility({ action: 'create', subject: 'ComplianceRequirement' })
  @ApiOperation({ summary: 'Create a compliance requirement' })
  async createRequirement(@Body() dto: CreateRequirementDto, @Req() req: any) {
    return this.service.createRequirement(dto, req.tenantContext.getTenantId());
  }

  @Get('requirements')
  @CheckAbility({ action: 'read', subject: 'ComplianceRequirement' })
  @ApiOperation({ summary: 'List compliance requirements' })
  async listRequirements(@Req() req: any, @Query('facilityId') facilityId: string, @Query('complianceType') complianceType: string) {
    return this.service.listRequirements(req.tenantContext.getTenantId(), { facilityId, complianceType });
  }

  @Post('audits')
  @CheckAbility({ action: 'create', subject: 'ComplianceAudit' })
  @ApiOperation({ summary: 'Create a compliance audit' })
  async createAudit(@Req() req: any, @Body() dto: CreateAuditDto) {
    return this.service.createAudit(req.tenantContext.getTenantId(), dto.facilityId, dto.requirementId, dto.scheduledDate, dto.auditedByUserId);
  }

  @Patch('audits/:id')
  @CheckAbility({ action: 'update', subject: 'ComplianceAudit' })
  @ApiOperation({ summary: 'Update audit result' })
  async updateAudit(@Param('id') id: string, @Body() dto: UpdateAuditDto, @Req() req: any) {
    return this.service.updateAudit(id, dto, req.tenantContext.getTenantId());
  }
}

@ApiTags('WMS-WEB', 'Quality')
@Controller('web/hazmat')
@UseGuards(CaslGuard)
export class HazmatWebController {
  constructor(private readonly service: ComplianceService) {}

  @Post('materials')
  @CheckAbility({ action: 'create', subject: 'HazmatMaterial' })
  @ApiOperation({ summary: 'Register a hazmat material' })
  async registerHazmat(@Body() dto: CreateHazmatDto, @Req() req: any) {
    return this.service.registerHazmat(dto, req.tenantContext.getTenantId());
  }

  @Get('materials')
  @CheckAbility({ action: 'read', subject: 'HazmatMaterial' })
  @ApiOperation({ summary: 'List hazmat materials' })
  async listHazmat(@Req() req: any, @Query('facilityId') facilityId: string, @Query('hazardClass') hazardClass: string) {
    return this.service.listHazmat(req.tenantContext.getTenantId(), { facilityId, hazardClass });
  }
}
