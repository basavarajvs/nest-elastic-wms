import { Controller, Post, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { SupervisorPinService } from '../supervisor-pin.service';

@ApiTags('Security')
@Controller('web/supervisor-pins')
@UseGuards(JwtAuthGuard, CaslGuard)
export class SecurityWebController {
  constructor(private readonly supervisorPinService: SupervisorPinService) {}

  @Post()
  @CheckAbility({ action: WmsAction.Create, subject: 'SupervisorPin' })
  @AuditLog({ eventType: 'SUPERVISOR_PIN_CREATE' })
  @ApiOperation({ summary: 'Create supervisor PIN for the current user' })
  async createPin(@Req() req: any, @Body() dto: { pin: string; expiryHours?: number }) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub || req.rfSession?.userId;
    return this.supervisorPinService.createPin(tenantId, userId, dto.pin, dto.expiryHours);
  }

  @Post('verify')
  @CheckAbility({ action: WmsAction.Validate, subject: 'SupervisorPin' })
  @ApiOperation({ summary: 'Verify PIN for the current authenticated user' })
  async verifyPin(@Req() req: any, @Body() dto: { pin: string }) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub || req.rfSession?.userId;
    return this.supervisorPinService.verifyPin(tenantId, userId, dto.pin);
  }

  @Post(':id/verify')
  @CheckAbility({ action: WmsAction.Validate, subject: 'SupervisorPin' })
  @ApiOperation({ summary: 'Verify a specific PIN record by its ID' })
  async verifyPinById(@Req() req: any, @Param('id') id: string, @Body() dto: { pin: string }) {
    const tenantId = req.tenantContext.getTenantId();
    return this.supervisorPinService.verifyPinById(tenantId, id, dto.pin);
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'SupervisorPin' })
  @AuditLog({ eventType: 'SUPERVISOR_PIN_DEACTIVATE' })
  @ApiOperation({ summary: 'Deactivate a supervisor PIN' })
  async deactivatePin(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.supervisorPinService.deactivate(tenantId, id);
  }
}
