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
    const store = this.resolveTenantStore(req);
    if (store) {
      (req as any).tenantContext = { getTenantId: () => store.tenantId };
    }
    next();
  }

  private resolveTenantStore(req: FastifyRequest): TenantStore | null {
    const user = (req as any).user as Record<string, any> | undefined;
    if (user?.tenantId) {
      return {
        tenantId: user.tenantId,
        tenantCode: user.tenantCode || '',
        tenantStatus: user.tenantStatus || 'active',
        isSystemContext: false,
      };
    }

    const authHeader = req.headers?.authorization as string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = this.decodeJwtPayload(token);
        if (payload?.tenantId) {
          return {
            tenantId: payload.tenantId,
            tenantCode: payload.tenantCode || '',
            tenantStatus: payload.tenantStatus || 'active',
            isSystemContext: false,
          };
        }
      } catch {
        // ignore decode errors
      }
    }

    return null;
  }

  private decodeJwtPayload(token: string): Record<string, any> | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      const padded = parts[1].padEnd(
        parts[1].length + (4 - (parts[1].length % 4)) % 4,
        '=',
      );
      const decoded = Buffer.from(padded, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }
}
