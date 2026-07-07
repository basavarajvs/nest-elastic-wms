import { Controller, Post, Get, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { ReceivingInspectionService } from '../receiving-inspection/receiving-inspection.service';
import { ReceivingInspectionDto, QcDispositionDto, ReceivingInspectionPaginatedDto, CreateReceivingInspectionDto, CreateQcDispositionDto } from '../dtos/receiving-inspection.dto';

@ApiTags('Quality')
@Controller('web/receiving-inspections')
@UseGuards(JwtAuthGuard, CaslGuard)
export class ReceivingInspectionController {
  constructor(private readonly service: ReceivingInspectionService) {}

  @Post()
  @ApiCreatedResponse({ type: ReceivingInspectionDto })
  @CheckAbility({ action: WmsAction.Create, subject: 'QualityInspection' })
  @AuditLog({ eventType: 'RECEIVING_INSPECTION_CREATE' })
  async create(@Req() req: any, @Body() dto: CreateReceivingInspectionDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.createInspection(tenantId, dto);
  }

  @Get()
  @ApiOkResponse({ type: ReceivingInspectionPaginatedDto })
  @CheckAbility({ action: WmsAction.List, subject: 'QualityInspection' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAllInspections(tenantId, query);
  }

  @Get(':id')
  @ApiOkResponse({ type: ReceivingInspectionDto })
  @CheckAbility({ action: WmsAction.Read, subject: 'QualityInspection' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findInspectionById(tenantId, id);
  }

  @Delete(':id')
  @ApiOkResponse({ type: ReceivingInspectionDto })
  @CheckAbility({ action: WmsAction.Delete, subject: 'QualityInspection' })
  @AuditLog({ eventType: 'RECEIVING_INSPECTION_DELETE' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.deleteInspection(tenantId, id);
  }
}

@ApiTags('Quality')
@Controller('web/qc-dispositions')
@UseGuards(JwtAuthGuard, CaslGuard)
export class QcDispositionController {
  constructor(private readonly service: ReceivingInspectionService) {}

  @Post()
  @ApiCreatedResponse({ type: QcDispositionDto })
  @CheckAbility({ action: WmsAction.Create, subject: 'QualityInspection' })
  @AuditLog({ eventType: 'QC_DISPOSITION_CREATE' })
  async create(@Req() req: any, @Body() dto: CreateQcDispositionDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.createQcDisposition(tenantId, dto);
  }

  @Get()
  @ApiOkResponse({ type: ReceivingInspectionPaginatedDto })
  @CheckAbility({ action: WmsAction.List, subject: 'QualityInspection' })
  async findAllQcDispositions(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAllQcDispositions(tenantId, query);
  }

  @Delete(':id')
  @ApiOkResponse({ type: QcDispositionDto })
  @CheckAbility({ action: WmsAction.Delete, subject: 'QualityInspection' })
  @AuditLog({ eventType: 'QC_DISPOSITION_DELETE' })
  async removeQcDisposition(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.deleteQcDisposition(tenantId, id);
  }
}
