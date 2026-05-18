import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SystemSettingService } from './system-setting.service';
import { CheckAbility } from '../common/decorators/check-ability.decorator';
import { CaslGuard } from '../common/guards/casl.guard';

@ApiTags('Admin')
@Controller('web/settings')
@UseGuards(CaslGuard)
export class SystemSettingController {
  constructor(private readonly settingService: SystemSettingService) {}

  @Get()
  @CheckAbility({ action: 'read', subject: 'SystemSetting' })
  async list(@Req() req: any) {
    return this.settingService.list(req.tenantContext.getTenantId());
  }

  @Get(':key')
  @CheckAbility({ action: 'read', subject: 'SystemSetting' })
  async get(@Req() req: any, @Param('key') key: string) {
    return this.settingService.get(req.tenantContext.getTenantId(), key);
  }

  @Post(':key')
  @CheckAbility({ action: 'create', subject: 'SystemSetting' })
  async upsert(
    @Req() req: any,
    @Param('key') key: string,
    @Body('value') value: any,
    @Body('description') description?: string,
  ) {
    return this.settingService.upsert(
      req.tenantContext.getTenantId(),
      key,
      value,
      description,
      req.user?.username,
    );
  }

  @Delete(':key')
  @CheckAbility({ action: 'delete', subject: 'SystemSetting' })
  async delete(@Req() req: any, @Param('key') key: string) {
    return this.settingService.delete(req.tenantContext.getTenantId(), key);
  }
}
