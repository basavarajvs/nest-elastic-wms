import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { CaslGuard } from '../common/guards/casl.guard';
import { RfSessionGuard } from './guards/rf-session.guard';
import { RfActionLightweightGuard } from './guards/rf-action-lightweight.guard';
import { RfAction } from '../common/decorators/rf-action.decorator';
import { CheckAbility } from '../common/decorators/check-ability.decorator';
import { AuditLog } from '../common/decorators/audit-log.decorator';
import { WmsAction } from '../casl/casl.types';
import { RfSessionService } from '../common/rf-session/rf-session.service';
import { RfSessionDto, RfSessionLoginDto, HeartbeatResponseDto, LogoutResponseDto } from './dtos/rf-session.dto';

@ApiTags('RF Session Management')
@Controller('rf/session')
export class RfSessionController {
  constructor(private readonly rfSessionService: RfSessionService) {}

  @Post('login')
  @UseGuards(JwtAuthGuard, CaslGuard)
  @CheckAbility({ action: WmsAction.Create, subject: 'RfSession' })
  @AuditLog({ eventType: 'RF_SESSION_LOGIN' })
  @ApiOperation({ summary: 'Create RF session (login from handheld)' })
  @ApiCreatedResponse({ type: RfSessionDto })
  async login(@Req() req: any, @Body() dto: RfSessionLoginDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.rfSessionService.createSession({
      tenantId,
      userId,
      facilityId: dto.facilityId,
      deviceId: dto.deviceId,
      workflowType: dto.workflowType,
    });
  }

  @Post('heartbeat')
  @UseGuards(RfSessionGuard, RfActionLightweightGuard)
  @RfAction('read')
  @ApiOperation({ summary: 'Renew RF session TTL (heartbeat)' })
  @ApiCreatedResponse({ type: HeartbeatResponseDto })
  async heartbeat(@Req() req: any) {
    const tenantId = req.tenantContext.getTenantId();
    const sessionId = req.rfSession.sessionId;
    return this.rfSessionService.heartbeat(sessionId, tenantId);
  }

  @Post('logout')
  @UseGuards(RfSessionGuard, RfActionLightweightGuard)
  @RfAction('delete')
  @AuditLog({ eventType: 'RF_SESSION_LOGOUT' })
  @ApiOperation({ summary: 'End RF session (logout)' })
  @ApiCreatedResponse({ type: LogoutResponseDto })
  async logout(@Req() req: any) {
    const tenantId = req.tenantContext.getTenantId();
    const sessionId = req.rfSession.sessionId;
    await this.rfSessionService.endSession(sessionId, tenantId);
    return { success: true };
  }

  @Get('current')
  @UseGuards(RfSessionGuard, RfActionLightweightGuard)
  @RfAction('read')
  @ApiOperation({ summary: 'Get current RF session info' })
  @ApiOkResponse({ type: RfSessionDto })
  async current(@Req() req: any) {
    const tenantId = req.tenantContext.getTenantId();
    const sessionId = req.rfSession.sessionId;
    const session = await this.rfSessionService.validateSession(sessionId, tenantId);
    return {
      sessionId: session.id,
      userId: session.user_id,
      facilityId: session.facility_id,
      deviceId: session.device_id,
      workflowType: session.workflow_type,
      startedAt: session.started_at,
      lastActivityAt: session.last_activity_at,
      expiresAt: session.expires_at,
    };
  }
}
