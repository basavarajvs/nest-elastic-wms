import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtValidationService } from '../../cluster/jwt-validation.service';
import { WmsAbilityFactory } from '../../casl/wms-ability.factory';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtValidation: JwtValidationService,
    private readonly abilityFactory: WmsAbilityFactory,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers?.authorization as string | undefined;

    if (!authHeader?.startsWith('Bearer ')) return true;

    const token = authHeader.slice(7);
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET') || '';
    const oldSecret = this.configService.get<string>('JWT_ACCESS_SECRET_OLD');

    try {
      const { valid, useOld } = await this.jwtValidation.validateToken(token);

      if (!valid) {
        throw new UnauthorizedException('Token revoked or expired');
      }

      const currentSecret = useOld && oldSecret ? oldSecret : secret;
      const payload = this.jwtService.verify(token, { secret: currentSecret }) as Record<string, any>;
      req.user = payload;

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
