import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../cache/redis.constants';
import { RF_ACTION_KEY } from './rf-action.decorator';

const CACHE_TTL = 60; // 60 seconds

const ROLE_ACTION_MAP: Record<string, string[]> = {
  WAREHOUSE_ADMIN: ['manage', 'create', 'read', 'update', 'delete', 'receive', 'pick', 'pack', 'ship', 'adjust', 'count', 'approve'],
  WAREHOUSE_SUPERVISOR: ['read', 'approve', 'adjust', 'count', 'receive', 'pick', 'pack', 'ship'],
  WAREHOUSE_OPERATOR: ['read', 'receive', 'pick', 'pack', 'ship', 'adjust'],
  INVENTORY_CLERK: ['read', 'count', 'adjust'],
  TENANT_ADMIN: ['manage', 'create', 'read', 'update', 'delete', 'receive', 'pick', 'pack', 'ship', 'adjust', 'count', 'approve'],
};

@Injectable()
export class RfActionLightweightGuard implements CanActivate {
  private readonly logger = new Logger(RfActionLightweightGuard.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredAction = this.reflector.getAllAndOverride<string>(
      RF_ACTION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredAction) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) {
      throw new ForbiddenException('RF action requires authentication');
    }

    const roles: string[] = user.roles || [];

    // Fast path: check via Redis cache
    const cacheKey = `wms:rf:role-actions:${roles.sort().join(',')}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const allowedActions = JSON.parse(cached) as string[];
        if (allowedActions.includes(requiredAction)) return true;
        throw new ForbiddenException(
          `RF action '${requiredAction}' not allowed for your role`,
        );
      }
    } catch (err: any) {
      if (err instanceof ForbiddenException) throw err;
      // Cache miss — compute below
    }

    // Compute from role map
    const allowedActions = new Set<string>();
    for (const role of roles) {
      const roleActions = ROLE_ACTION_MAP[role];
      if (roleActions) {
        roleActions.forEach((a) => allowedActions.add(a));
      }
    }

    // Cache result
    try {
      await this.redis.setex(
        cacheKey,
        CACHE_TTL,
        JSON.stringify([...allowedActions]),
      );
    } catch (err) {
      this.logger.warn(`Redis cache set failed: ${err}`);
    }

    if (!allowedActions.has(requiredAction)) {
      throw new ForbiddenException(
        `RF action '${requiredAction}' not allowed for your role`,
      );
    }

    return true;
  }
}
