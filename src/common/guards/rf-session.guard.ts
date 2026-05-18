import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { RfSessionService } from '../../rf/rf-session.service';

@Injectable()
export class RfSessionGuard implements CanActivate {
  constructor(private readonly rfSession: RfSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const sessionId = req.params?.id || req.headers['x-rf-session-id'];

    if (!sessionId) {
      throw new UnauthorizedException('RF session ID required');
    }

    const session = await this.rfSession.getSession(sessionId);
    if (!session) {
      throw new UnauthorizedException('RF session expired or not found');
    }

    req.rfSession = session;
    return true;
  }
}
