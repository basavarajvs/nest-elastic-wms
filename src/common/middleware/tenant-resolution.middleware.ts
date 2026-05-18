import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { TenantContextService, TenantStore } from '../context/tenant-context.service';

@Injectable()
export class TenantResolutionMiddleware implements NestMiddleware {
  constructor(private readonly tenantContext: TenantContextService) {}

  use(req: FastifyRequest, _res: FastifyReply, next: () => void) {
    const tenantId = (req as any).user?.tenantId || (req.headers['x-tenant-id'] as string);

    if (tenantId) {
      const store: TenantStore = {
        tenantId,
        tenantCode: (req as any).user?.tenantCode || '',
        tenantStatus: 'active',
        isSystemContext: false,
      };
      this.tenantContext.set(store);
      (req as any).tenantContext = this.tenantContext;
    }

    next();
  }
}
