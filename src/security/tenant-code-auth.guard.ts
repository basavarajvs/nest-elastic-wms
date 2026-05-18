import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';

@Injectable()
export class TenantCodeAuthGuard implements CanActivate {
  private readonly logger = new Logger(TenantCodeAuthGuard.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const tenantCode = req.headers?.['x-tenant-code'] as string;

    if (!tenantCode) {
      throw new UnauthorizedException('X-Tenant-Code header is required');
    }

    const cached = await this.redis.get(`tenant:code:${tenantCode}`);
    if (!cached) {
      this.logger.warn(`Invalid X-Tenant-Code: ${tenantCode}`);
      throw new UnauthorizedException(`Tenant not found: ${tenantCode}`);
    }

    const tenantInfo = JSON.parse(cached);
    if (tenantInfo.status !== 'active') {
      throw new UnauthorizedException(`Tenant ${tenantCode} is ${tenantInfo.status}`);
    }

    req.tenantContext.set({ tenantId: tenantInfo.id, tenantCode, tenantStatus: tenantInfo.status, isSystemContext: false });
    return true;
  }

  async validateAndCache(tenantCode: string, tenantInfo: { id: string; status: string }): Promise<void> {
    await this.redis.set(`tenant:code:${tenantCode}`, JSON.stringify(tenantInfo), 'EX', 3600);
  }
}
