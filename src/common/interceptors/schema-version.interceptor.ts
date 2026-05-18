import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventEmitter2 } from '@nestjs/event-emitter';

const DEPRECATED_SINCE = new Map<string, string>();

@Injectable()
export class SchemaVersionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SchemaVersionInterceptor.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const path: string = req?.url || '';

    const versionMatch = path.match(/\/api\/v(\d+)\//);
    const version = versionMatch ? parseInt(versionMatch[1], 10) : 1;

    return next.handle().pipe(
      map((data) => {
        if (version === 1 && this.hasBreakingChange(path)) {
          return {
            ...data,
            _deprecated: true,
            _sunset: DEPRECATED_SINCE.get(path) || 'unknown',
            _migration: `See /api/v2/docs for updated schema`,
          };
        }
        return data;
      }),
    );
  }

  hasBreakingChange(path: string): boolean {
    return DEPRECATED_SINCE.has(path);
  }

  markDeprecated(path: string, sunsetDate: string): void {
    DEPRECATED_SINCE.set(path, sunsetDate);
    this.eventEmitter.emit('api.spec.changed', {
      path,
      sunsetDate,
      message: `Breaking schema change: ${path} will be removed after ${sunsetDate}`,
    });
    this.logger.warn(`API spec changed — ${path} deprecated until ${sunsetDate}`);
  }

  getDeprecatedPaths(): Array<{ path: string; sunset: string }> {
    return Array.from(DEPRECATED_SINCE.entries()).map(([path, sunset]) => ({ path, sunset }));
  }
}
