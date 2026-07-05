import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RF_ACTION_KEY, RfActionType } from '../../common/decorators/rf-action.decorator';

// Manhattan WMS workflow types that map to permitted RF actions
const WORKFLOW_ACTION_MAP: Record<string, RfActionType[]> = {
  RECEIVING: ['read', 'create', 'update'],
  PUTAWAY: ['read', 'create', 'update'],
  PICKING: ['read', 'create', 'update'],
  PACKING: ['read', 'create', 'update'],
  SHIPPING: ['read', 'update'],
  CYCLE_COUNT: ['read', 'create', 'update'],
  TRANSFERS: ['read', 'create', 'update'],
  QUALITY: ['read', 'create', 'update'],
  REPLENISHMENT: ['read', 'create', 'update'],
  LABOR: ['read', 'create', 'update'],
  EQUIPMENT: ['read', 'create', 'update'],
  VAS: ['read', 'create', 'update'],
  MAINTENANCE: ['read', 'update'],
  ADMIN: ['read', 'create', 'update', 'delete'],
};

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

    const workflowType = session.workflowType as string | undefined;
    if (workflowType) {
      const allowedActions = WORKFLOW_ACTION_MAP[workflowType];
      if (allowedActions && !allowedActions.includes(action)) {
        throw new ForbiddenException(
          `Action '${action}' not permitted for workflow type '${workflowType}'`,
        );
      }
    }

    return true;
  }
}
