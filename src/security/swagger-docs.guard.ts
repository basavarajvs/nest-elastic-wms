import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SwaggerDocsGuard implements CanActivate {
  private readonly logger = new Logger(SwaggerDocsGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const swaggerEnabled = this.configService.get<boolean>('SWAGGER_ENABLED', true);

    if (!swaggerEnabled) {
      return false;
    }

    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    if (!isProd) return true;

    const systemToken = req.headers?.['x-system-token'] as string;
    const expectedToken = this.configService.get<string>('CORE_API_TOKEN');

    if (systemToken && expectedToken && systemToken === expectedToken) {
      return true;
    }

    this.logger.warn('Unauthorized Swagger UI access attempt');
    return false;
  }
}
