import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { SettingsService } from '../settings.service';

@ApiTags('Settings')
@Controller('web/settings')
@UseGuards(JwtAuthGuard, CaslGuard)
export class SettingsWebController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'SystemSetting' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.settingsService.findAll(tenantId, query);
  }

  @Get('defaults')
  @CheckAbility({ action: WmsAction.List, subject: 'SystemSetting' })
  async getAllWithDefaults(@Req() req: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.settingsService.getAllWithDefaults(tenantId);
  }

  @Get(':key')
  @CheckAbility({ action: WmsAction.Read, subject: 'SystemSetting' })
  async get(@Req() req: any, @Param('key') key: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.settingsService.get(tenantId, key);
  }

  @Post(':key')
  @CheckAbility({ action: WmsAction.Create, subject: 'SystemSetting' })
  @AuditLog({ eventType: 'SETTING_CREATE' })
  async upsert(@Req() req: any, @Param('key') key: string, @Body() dto: { value: string; description?: string }) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.settingsService.set(tenantId, key, dto.value, userId, dto.description);
  }

  @Patch(':key')
  @CheckAbility({ action: WmsAction.Update, subject: 'SystemSetting' })
  @AuditLog({ eventType: 'SETTING_UPDATE' })
  async update(@Req() req: any, @Param('key') key: string, @Body() dto: { value: string }) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.settingsService.validateAndSet(tenantId, key, dto.value, userId);
  }

  @Delete(':key')
  @CheckAbility({ action: WmsAction.Delete, subject: 'SystemSetting' })
  @AuditLog({ eventType: 'SETTING_DELETE' })
  async remove(@Req() req: any, @Param('key') key: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.settingsService.delete(tenantId, key);
  }

  @Get(':key/history')
  @CheckAbility({ action: WmsAction.List, subject: 'SystemSetting' })
  async getHistory(@Req() req: any, @Param('key') key: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.settingsService.getHistory(tenantId, key);
  }
}
