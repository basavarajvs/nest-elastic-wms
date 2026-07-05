import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RequestSemaphoreInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestSemaphoreInterceptor.name);
  private active = 0;
  private readonly maxConcurrent: number;

  constructor(config: ConfigService) {
    const poolLimit = config.get<number>('DB_POOL_LIMIT', 20);
    this.maxConcurrent = Math.floor(poolLimit * 0.8);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (this.active >= this.maxConcurrent) {
      this.logger.warn(
        `DB pool at ${this.active}/${this.maxConcurrent} — rejecting request`,
      );
      throw new ServiceUnavailableException(
        'Database pool at capacity, try again shortly',
      );
    }

    this.active++;
    return new Observable((subscriber) => {
      const sub = next.handle().subscribe({
        next: (v) => subscriber.next(v),
        error: (e) => {
          this.active--;
          subscriber.error(e);
        },
        complete: () => {
          this.active--;
          subscriber.complete();
        },
      });
      return () => {
        this.active--;
        sub.unsubscribe();
      };
    });
  }
}
