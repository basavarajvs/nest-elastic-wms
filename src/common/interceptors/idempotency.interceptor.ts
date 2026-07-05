import {
  Inject,
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import Redis from 'ioredis';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);
  private readonly ttlMs: number;

  constructor(
    private readonly config: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {
    this.ttlMs = this.config.get<number>('IDEMPOTENCY_TTL_MS', 300000);
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    const method = req.method?.toUpperCase();

    if (method !== 'POST' && method !== 'PATCH' && method !== 'DELETE') {
      return next.handle();
    }

    const idempotencyKey =
      req.headers['idempotency-key'] || this.bodyHash(req.body);

    if (!idempotencyKey) {
      return next.handle();
    }

    const cacheKey = `wms:idempotency:${idempotencyKey}`;

    try {
      const existing = await this.redis.get(cacheKey);
      if (existing) {
        this.logger.debug(`Idempotency hit: ${cacheKey}`);
        return of(JSON.parse(existing));
      }
    } catch (err) {
      this.logger.warn(`Idempotency cache read failed: ${(err as Error).message}`);
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: async (data) => {
          try {
            await this.redis.set(cacheKey, JSON.stringify(data), 'PX', this.ttlMs);
          } catch (err) {
            this.logger.warn(`Idempotency cache write failed: ${(err as Error).message}`);
          }
        },
      }),
    );
  }

  private bodyHash(body: any): string | null {
    if (!body || typeof body !== 'object') return null;
    const raw = JSON.stringify(body);
    return createHash('sha256').update(raw).digest('hex');
  }
}
