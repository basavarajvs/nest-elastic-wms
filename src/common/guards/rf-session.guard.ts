import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RfSessionService } from '../rf-session/rf-session.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class RfSessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rfSessionService: RfSessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const sessionId = req.headers?.['x-rf-session-id'] as string | undefined;

    if (!sessionId) {
      throw new UnauthorizedException('Missing x-rf-session-id header');
    }

    const tenantId = req.tenantContext?.getTenantId();
    if (!tenantId) {
      throw new UnauthorizedException('No tenant context');
    }

    const session = await this.rfSessionService.validateSession(
      sessionId,
      tenantId,
    );
    req.rfSession = {
      sessionId: session.id,
      userId: session.user_id,
      facilityId: session.facility_id,
      deviceInfo: session.device_info,
    };

    return true;
  }
}
