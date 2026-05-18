import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../context/tenant-context.service';
import { QuotaExceededException } from '../exceptions/quota-exceeded.exception';
import { QUOTA_CHECK_KEY } from '../decorators/quota-check.decorator';

@Injectable()
export class QuotaGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resourceType = this.reflector.getAllAndOverride<string>(
      QUOTA_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!resourceType) return true;

    const tenantId = this.tenantContext.getTenantId();

    const quota = await this.prisma.resourceQuota.findFirst({
      where: { tenantId, resourceType },
      select: { limitAmount: true, currentUsage: true },
    });

    if (quota && Number(quota.currentUsage) >= Number(quota.limitAmount)) {
      throw new QuotaExceededException(
        resourceType,
        Number(quota.limitAmount),
        Number(quota.currentUsage),
      );
    }

    return true;
  }
}
