import {
  Injectable,
  NestMiddleware,
  Logger,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { TenantContextService, TenantStore } from '../context/tenant-context.service';

@Injectable()
export class TenantResolutionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantResolutionMiddleware.name);

  constructor(private readonly tenantContext: TenantContextService) {}

  use(req: FastifyRequest, _res: FastifyReply, next: () => void) {
    const user = (req as any).user as Record<string, any> | undefined;

    if (user?.tenantId) {
      const store: TenantStore = {
        tenantId: user.tenantId,
        tenantCode: user.tenantCode || '',
        tenantStatus: user.tenantStatus || 'active',
        isSystemContext: false,
      };
      this.tenantContext.set(store);
      (req as any).tenantContext = this.tenantContext;
    }

    next();
  }
}
