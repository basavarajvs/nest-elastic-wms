import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RF_ACTION_KEY, RfActionType } from '../decorators/rf-action.decorator';

@Injectable()
export class RfActionLightweightGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const action = this.reflector.getAllAndOverride<RfActionType>(
      RF_ACTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!action) return true;

    const req = context.switchToHttp().getRequest();
    const session = req.rfSession;

    if (!session) {
      throw new ForbiddenException('No active RF session');
    }

    return true;
  }
}
