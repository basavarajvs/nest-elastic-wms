import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContextService } from '../context/tenant-context.service';

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const tenantContext: TenantContextService = req.tenantContext;
    return tenantContext?.get();
  },
);
