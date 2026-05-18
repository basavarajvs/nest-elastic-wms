import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { DbPoolMonitorService } from '../../observability/db-pool-monitor.service';

const POOL_LIMIT = parseInt(process.env.DB_POOL_LIMIT || '20', 10);
const MAX_CONCURRENT = Math.floor(POOL_LIMIT * 0.8);
let currentRequests = 0;

@Injectable()
export class RequestSemaphoreInterceptor implements NestInterceptor {
  constructor(private readonly dbPoolMonitor: DbPoolMonitorService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const path: string = req?.url || '';

    if (this.dbPoolMonitor.isSaturated()) {
      throw new HttpException(
        {
          type: 'https://wms.internal/problems/db-pool-saturated',
          title: 'Service Unavailable',
          status: HttpStatus.SERVICE_UNAVAILABLE,
          detail: 'Database connection pool is saturated. Retry after backoff.',
          retryAfterMs: 5000,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
        { cause: { retryAfterMs: 5000 } },
      );
    }

    if (currentRequests >= MAX_CONCURRENT) {
      throw new HttpException(
        {
          type: 'https://wms.internal/problems/too-many-requests',
          title: 'Too Many Requests',
          status: HttpStatus.TOO_MANY_REQUESTS,
          detail: `Too many concurrent DB requests (${currentRequests} >= ${MAX_CONCURRENT}). Retry with exponential backoff.`,
          retryAfterMs: 1000,
        },
        HttpStatus.TOO_MANY_REQUESTS,
        { cause: { retryAfterMs: 1000 } },
      );
    }

    currentRequests++;
    return new Observable((subscriber) => {
      next.handle().subscribe({
        next: (value) => {
          currentRequests = Math.max(0, currentRequests - 1);
          subscriber.next(value);
        },
        error: (err) => {
          currentRequests = Math.max(0, currentRequests - 1);
          subscriber.error(err);
        },
        complete: () => {
          currentRequests = Math.max(0, currentRequests - 1);
          subscriber.complete();
        },
      });
    });
  }
}
