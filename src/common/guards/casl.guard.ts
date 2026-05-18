import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WmsAbilityFactory } from '../../casl/wms-ability.factory';
import { CHECK_ABILITY_KEY, PolicyHandler } from '../decorators/check-ability.decorator';

@Injectable()
export class CaslGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly abilityFactory: WmsAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const jwtPayload = req.user;

    if (!jwtPayload) return true;

    const policies = this.reflector.getAllAndOverride<PolicyHandler[]>(
      CHECK_ABILITY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!policies || policies.length === 0) return true;

    const ability = this.abilityFactory.createForUser(jwtPayload);

    for (const policy of policies) {
      if (!ability.can(policy.action as any, policy.subject as any)) {
        throw new ForbiddenException(
          `Insufficient permissions: cannot ${policy.action} ${policy.subject}`,
        );
      }
    }

    req.ability = ability;
    return true;
  }
}
