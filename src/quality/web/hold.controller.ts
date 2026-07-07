import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { QualityHoldService } from '../holds/quality-hold.service';
import { QualityHoldDto, QualityHoldPaginatedDto, CreateQualityHoldDto, UpdateQualityHoldDto, ReleaseQualityHoldDto } from '../dtos/quality-hold.dto';

@ApiTags('Quality')
@Controller('web/quality-holds')
@UseGuards(JwtAuthGuard, CaslGuard)
export class HoldController {
  constructor(private readonly service: QualityHoldService) {}

  @Post()
  @ApiCreatedResponse({ type: QualityHoldDto })
  @CheckAbility({ action: WmsAction.Create, subject: 'QualityInspection' })
  @AuditLog({ eventType: 'QUALITY_HOLD_CREATE' })
  async create(@Req() req: any, @Body() dto: CreateQualityHoldDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @ApiOkResponse({ type: QualityHoldPaginatedDto })
  @CheckAbility({ action: WmsAction.List, subject: 'QualityInspection' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOkResponse({ type: QualityHoldDto })
  @CheckAbility({ action: WmsAction.Read, subject: 'QualityInspection' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: QualityHoldDto })
  @CheckAbility({ action: WmsAction.Update, subject: 'QualityInspection' })
  @AuditLog({ eventType: 'QUALITY_HOLD_UPDATE' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateQualityHoldDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: QualityHoldDto })
  @CheckAbility({ action: WmsAction.Delete, subject: 'QualityInspection' })
  @AuditLog({ eventType: 'QUALITY_HOLD_DELETE' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, id);
  }

  @Post(':id/release')
  @ApiCreatedResponse({ type: QualityHoldDto })
  @CheckAbility({ action: WmsAction.Release, subject: 'QualityInspection' })
  @AuditLog({ eventType: 'QUALITY_HOLD_RELEASE' })
  async release(@Req() req: any, @Param('id') id: string, @Body() dto: ReleaseQualityHoldDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub || req.rfSession?.userId;
    return this.service.release(tenantId, id, userId, dto?.reason);
  }
}
