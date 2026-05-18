import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { RfSessionService } from './rf-session.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('WMS-RF')
@Controller('rf/sessions')
export class RfSessionController {
  constructor(private readonly rfSession: RfSessionService) {}

  @Post('start')
  async start(
    @Req() req: any,
    @Body()
    body: {
      workflow: string;
      payload: Record<string, any>;
    },
  ) {
    const tenantId = req.tenantContext?.getTenantId() || req.headers['x-tenant-id'] || 'system';
    const userId = req.user?.userId || req.user?.sub || 'anonymous';
    return this.rfSession.start(tenantId, userId, body.workflow, body.payload);
  }

  @Post(':id/step')
  async step(
    @Param('id') id: string,
    @Body() stepData: Record<string, any>,
  ) {
    const session = await this.rfSession.advanceStep(id, stepData);
    if (!session) throw new NotFoundException('Session expired or not found');
    return { sessionId: id, state: session.state };
  }

  @Post(':id/resume')
  async resume(@Param('id') id: string) {
    const session = await this.rfSession.resume(id);
    if (!session) throw new NotFoundException('Session expired or not found');
    return { sessionId: id, workflow: session.workflow, state: session.state };
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  async complete(@Param('id') id: string) {
    await this.rfSession.complete(id);
    return { completed: true };
  }

  @Post(':id/extend')
  async extend(@Param('id') id: string) {
    const extended = await this.rfSession.extend(id);
    if (!extended) {
      throw new NotFoundException('Session expired or not found');
    }
    return { extended: true, ttlSeconds: 900 };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const session = await this.rfSession.getSession(id);
    if (!session) throw new NotFoundException('Session expired or not found');
    return {
      sessionId: session.sessionId,
      workflow: session.workflow,
      state: session.state,
      lastActivityAt: session.lastActivityAt,
    };
  }
}
