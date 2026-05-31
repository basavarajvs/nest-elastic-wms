import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { TenantContextService, TenantStore } from '../context/tenant-context.service';

@Injectable()
export class TenantResolutionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantResolutionMiddleware.name);

  constructor(private readonly tenantContext: TenantContextService) {}

  use(req: FastifyRequest, _res: FastifyReply, next: () => void) {
    console.log(`[TenantResolutionMiddleware] Running for ${req.url}`);

    // Always attach the service instance so downstream code can safely call req.tenantContext
    (req as any).tenantContext = this.tenantContext;

    // Extract tenantId/tenantCode from JWT Bearer token (base64-decode payload, no crypto needed)
    const authHeader = req.headers?.authorization as string | undefined;
    let jwtTenantId: string | undefined;
    let jwtTenantCode: string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const payloadBase64 = authHeader.slice(7).split('.')[1];
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf-8'));
        jwtTenantId = payload.tenantId;
        jwtTenantCode = payload.tenantCode;
      } catch {
        // ignore malformed tokens — guard will reject later
      }
    }

    const tenantId =
      (req as any).user?.tenantId || jwtTenantId || (req.headers['x-tenant-id'] as string);
    const tenantCode =
      (req as any).user?.tenantCode || jwtTenantCode || '';

    console.log(`[TenantResolutionMiddleware] tenantId: ${tenantId}, has tenantContext: ${!!(req as any).tenantContext}`);

    if (tenantId) {
      const store: TenantStore = {
        tenantId,
        tenantCode,
        tenantStatus: 'active',
        isSystemContext: false,
      };
      this.tenantContext.set(store);
    }

    next();
  }
}
