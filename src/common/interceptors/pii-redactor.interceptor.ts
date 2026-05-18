import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TenantContextService } from '../context/tenant-context.service';

const PII_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, replacement: '***@***.***' },
  { pattern: /\b(\+?\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g, replacement: '***-***-****' },
  { pattern: /\b[A-Za-z0-9]{8,}[-_][A-Za-z0-9]{8,}\b/g, replacement: '****-****' },
];

const ROLE_BYPASS = ['WAREHOUSE_ADMIN', 'SYSTEM_ADMIN'];

@Injectable()
export class PiiRedactorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PiiRedactorInterceptor.name);

  constructor(private readonly tenantContext: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';
    if (!isProd) return next.handle();

    const req = context.switchToHttp().getRequest();
    const roles: string[] = req?.user?.roles || [];
    const bypassRedaction = roles.some((r: string) => ROLE_BYPASS.includes(r));

    const traceId = req?.headers?.['x-request-id'] || req?.id || '';
    const deviceId = req?.headers?.['x-scanner-device-id'] || '';

    try {
      const tenantId = this.tenantContext.getTenantId();
      (req as any).logContext = { tenantId, traceId, deviceId };
    } catch {
      (req as any).logContext = { traceId, deviceId };
    }

    if (bypassRedaction) {
      if (roles.includes('SYSTEM_ADMIN') || roles.includes('WAREHOUSE_ADMIN')) {
        this.logger.debug('PII redaction bypassed for admin user');
        const log = this.logger;
        process.nextTick(() => {
          log.warn('log.redaction.bypass', { roles, traceId });
        });
      }
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => this.redactDeep(data)),
    );
  }

  private redactDeep(value: any): any {
    if (typeof value === 'string') {
      return this.redactString(value);
    }
    if (Array.isArray(value)) {
      return value.map((v) => this.redactDeep(v));
    }
    if (value && typeof value === 'object') {
      const redacted: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        if (this.isSensitiveKey(k)) {
          redacted[k] = '***REDACTED***';
        } else {
          redacted[k] = this.redactDeep(v);
        }
      }
      return redacted;
    }
    return value;
  }

  private redactString(str: string): string {
    let result = str;
    for (const { pattern, replacement } of PII_PATTERNS) {
      result = result.replace(pattern, replacement);
    }
    return result;
  }

  private isSensitiveKey(key: string): boolean {
    const sensitive = ['password', 'secret', 'apiKey', 'api_key', 'token', 'jwt', 'authorization'];
    return sensitive.includes(key.toLowerCase());
  }
}
