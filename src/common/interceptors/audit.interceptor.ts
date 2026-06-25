import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { AUDIT_LOG_KEY, AuditLogOptions } from '../decorators/audit-log.decorator';
import { AuditService } from '../../observability/audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler();
    const options = this.reflector.get<AuditLogOptions>(AUDIT_LOG_KEY, handler);
    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantContext?.getTenantId?.() || request.headers['x-tenant-id'];
    const changedByUserId = request.user?.id || request.user?.userId;
    const ipAddress = request.ip || request.connection?.remoteAddress;
    const userAgent = request.headers['user-agent'];

    const entityId = this.resolveEntityId(request, options);

    let oldValue: any;

    if (request.method === 'PATCH' || request.method === 'PUT') {
      oldValue = request.oldEntityData || undefined;
    }

    return next.handle().pipe(
      tap((responseData: any) => {
        try {
          this.auditService.write({
            tenantId,
            facilityId: request.body?.facilityId || request.query?.facilityId,
            action: options.action,
            entityType: options.entityType,
            entityId,
            oldValue: oldValue || undefined,
            newValue: responseData?.data || responseData || undefined,
            changedByUserId,
            ipAddress,
            userAgent,
          }).catch(() => {});
        } catch {
          /* silent */
        }
      }),
    );
  }

  private resolveEntityId(request: any, options: AuditLogOptions): string {
    switch (options.entityIdSource) {
      case 'param':
        return request.params?.[options.entityIdKey || 'id'] || '';
      case 'body':
        return request.body?.[options.entityIdKey || 'id'] || '';
      case 'query':
        return request.query?.[options.entityIdKey || 'id'] || '';
      default:
        return request.params?.id || request.body?.id || '';
    }
  }
}
