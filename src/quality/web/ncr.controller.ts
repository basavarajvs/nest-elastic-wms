import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { NcrService } from '../ncr/ncr.service';
import { NcrDto, NcrPaginatedDto, CreateNcrDto, UpdateNcrDto } from '../dtos/ncr.dto';

@ApiTags('Quality')
@Controller('web/non-conformance-reports')
@UseGuards(JwtAuthGuard, CaslGuard)
export class NcrController {
  constructor(private readonly service: NcrService) {}

  @Post()
  @ApiCreatedResponse({ type: NcrDto })
  @CheckAbility({ action: WmsAction.Create, subject: 'QualityInspection' })
  @AuditLog({ eventType: 'NCR_CREATE' })
  async create(@Req() req: any, @Body() dto: CreateNcrDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub || req.rfSession?.userId;
    return this.service.create(tenantId, { ...dto, reported_by_user_id: userId });
  }

  @Get()
  @ApiOkResponse({ type: NcrPaginatedDto })
  @CheckAbility({ action: WmsAction.List, subject: 'QualityInspection' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOkResponse({ type: NcrDto })
  @CheckAbility({ action: WmsAction.Read, subject: 'QualityInspection' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: NcrDto })
  @CheckAbility({ action: WmsAction.Update, subject: 'QualityInspection' })
  @AuditLog({ eventType: 'NCR_UPDATE' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateNcrDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub || req.rfSession?.userId;
    return this.service.update(tenantId, id, { ...dto, updated_by: userId });
  }

  @Delete(':id')
  @ApiOkResponse({ type: NcrDto })
  @CheckAbility({ action: WmsAction.Delete, subject: 'QualityInspection' })
  @AuditLog({ eventType: 'NCR_DELETE' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, id);
  }
}
