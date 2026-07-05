import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { QUOTA_CHECK_KEY } from '../decorators/quota-check.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { QuotaExceededException } from '../exceptions/quota-exceeded.exception';

@Injectable()
export class QuotaGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const quotaCheck = this.reflector.getAllAndOverride(QUOTA_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!quotaCheck) return true;

    const req = context.switchToHttp().getRequest();
    const tenantId = req.tenantContext?.getTenantId();
    if (!tenantId) return true;

    const result = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT current_usage, limit_amount FROM multitenant.resource_quotas
       WHERE tenant_id = $1::uuid AND resource_type = $2`,
      tenantId,
      quotaCheck.resourceType,
    );

    if (result && result.length > 0) {
      const quota = result[0];
      if (Number(quota.current_usage) >= Number(quota.limit_amount)) {
        throw new QuotaExceededException(quotaCheck.resourceType, Number(quota.limit_amount), Number(quota.current_usage));
      }
    }

    return true;
  }
}
