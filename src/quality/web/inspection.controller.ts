import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { InspectionService } from '../inspections/inspection.service';

@ApiTags('Quality')
@Controller('web/quality/inspections')
@UseGuards(JwtAuthGuard, CaslGuard)
export class InspectionController {
  constructor(private readonly service: InspectionService) {}

  @Post()
  @CheckAbility({ action: WmsAction.Create, subject: 'QualityInspection' })
  @AuditLog({ eventType: 'INSPECTION_CREATE' })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'QualityInspection' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'QualityInspection' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, id);
  }

  @Patch(':id')
  @CheckAbility({ action: WmsAction.Update, subject: 'QualityInspection' })
  @AuditLog({ eventType: 'INSPECTION_UPDATE' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.recordResult(tenantId, id, dto);
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'QualityInspection' })
  @AuditLog({ eventType: 'INSPECTION_DELETE' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, id);
  }

  @Post(':id/record-result')
  @CheckAbility({ action: WmsAction.PerformQc, subject: 'QualityInspection' })
  @AuditLog({ eventType: 'INSPECTION_RECORD_RESULT' })
  async recordResult(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub || req.rfSession?.userId;
    return this.service.recordResult(tenantId, id, { ...dto, createdBy: userId });
  }

  @Get(':id/timeline')
  @CheckAbility({ action: WmsAction.Read, subject: 'QualityInspection' })
  async getTimeline(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.getTimeline(tenantId, id);
  }
}
