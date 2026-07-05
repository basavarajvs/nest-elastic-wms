import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AUDIT_LOG_KEY, AuditLogOptions } from '../decorators/audit-log.decorator';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOpts = this.reflector.getAllAndOverride<AuditLogOptions>(
      AUDIT_LOG_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!auditOpts) return next.handle();

    const req = context.switchToHttp().getRequest();
    const tenantId = req.tenantContext?.getTenantId();
    const userId = req.user?.sub || req.rfSession?.userId;

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          const detail = auditOpts.detail
            ? auditOpts.detail(req, req.body)
            : `${req.method} ${req.url}`;

          this.auditService.log({
            tenantId,
            userId,
            action: auditOpts.eventType,
            tableName: req.route?.path || req.url,
            recordId: req.params?.id,
            newValue: responseBody?.data || responseBody,
            sessionId: req.rfSession?.sessionId,
            ipAddress: req.ip,
            notes: detail,
          }).catch((err) => this.logger.error(`Audit log error: ${err}`));
        },
        error: () => {},
      }),
    );
  }
}
