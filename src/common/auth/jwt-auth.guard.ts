import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { verify } from 'jsonwebtoken';
import { JwtValidationService } from './jwt-validation.service';
import { WmsAbilityFactory } from '../../casl/wms-ability.factory';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtValidation: JwtValidationService,
    private readonly abilityFactory: WmsAbilityFactory,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers?.authorization as string | undefined;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.slice(7);
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET') || '';
    const oldSecret = this.configService.get<string>('JWT_ACCESS_SECRET_OLD');

    try {
      const { valid, useOld } = await this.jwtValidation.validateToken(token);
      if (!valid) {
        throw new UnauthorizedException('Token revoked or expired');
      }

      const currentSecret = useOld && oldSecret ? oldSecret : secret;
      const payload = verify(token, currentSecret) as Record<string, any>;

      req.user = payload;

      // Set tenant context on the request for downstream handlers
      if (payload.tenantId) {
        req.tenantContext = {
          getTenantId: () => payload.tenantId,
          getTenantCode: () => payload.tenantCode || '',
        };
      }

      const ability = this.abilityFactory.createForUser(payload);
      req.ability = ability;

      if (payload.jti) {
        req.tokenId = payload.jti;
      }

      return true;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
