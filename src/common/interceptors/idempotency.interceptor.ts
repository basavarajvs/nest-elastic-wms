import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import * as crypto from 'crypto';

// ── Challenge 5: Payload canonicalization ──
// Canonicalizes JSON payload: sorts object keys, strips null values,
// normalizes timestamps to UTC ISO8601, then computes SHA256.

interface CacheEntry {
  statusCode: number;
  body: any;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly inFlight = new Set<string>();

  // TTL for completed idempotency keys (5 min default)
  private readonly ttlMs = parseInt(process.env.IDEMPOTENCY_TTL_MS || '300000', 10);

  // Cleanup stale entries every 60s
  private lastCleanup = Date.now();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    // Only apply to mutating requests
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return next.handle();
    }

    // Compute canonical idempotency key from request body
    const idempotencyKey = this.computeIdempotencyKey(request);
    if (!idempotencyKey) {
      return next.handle();
    }

    // Check in-flight (duplicate already being processed)
    if (this.inFlight.has(idempotencyKey)) {
      this.logger.warn(`Idempotency conflict — already processing key=${idempotencyKey.substring(0, 16)}...`);
      throw new ConflictException({
        statusCode: 409,
        error: 'Conflict',
        message: 'Request is already being processed',
        idempotencyKey: idempotencyKey.substring(0, 16) + '...',
      });
    }

    // Check completed cache
    const cached = this.cache.get(idempotencyKey);
    if (cached) {
      this.logger.debug(`Idempotency hit — returning cached response for key=${idempotencyKey.substring(0, 16)}...`);
      const response = context.switchToHttp().getResponse();
      response.status(cached.statusCode);
      return of(cached.body);
    }

    // Mark as in-flight
    this.inFlight.add(idempotencyKey);

    // Perform periodic cleanup
    this.cleanupStaleEntries();

    return next.handle().pipe(
      tap((responseBody: any) => {
        // Cache successful responses
        const response = context.switchToHttp().getResponse();
        this.cache.set(idempotencyKey, {
          statusCode: response.statusCode,
          body: responseBody,
        });

        // Auto-expire from cache and in-flight
        setTimeout(() => {
          this.cache.delete(idempotencyKey);
          this.inFlight.delete(idempotencyKey);
        }, this.ttlMs);

        this.inFlight.delete(idempotencyKey);
      }),
      catchError((error: any) => {
        // On error, release in-flight lock but don't cache
        this.inFlight.delete(idempotencyKey);
        throw error;
      }),
    );
  }

  private computeIdempotencyKey(request: any): string | null {
    // Priority 1: Explicit Idempotency-Key header
    const explicitKey = request.headers?.['idempotency-key'] as string;
    if (explicitKey) {
      return `idem:${explicitKey}`;
    }

    // Priority 2: Webhook HMAC signature header
    const hmacHeader =
      (request.headers?.['x-shopify-hmac-sha256'] as string) ||
      (request.headers?.['x-wc-webhook-signature'] as string);
    if (hmacHeader) {
      return `idem:hmac:${hmacHeader}`;
    }

    // Priority 3: Compute from canonicalized body (for repeat requests without explicit key)
    const body = request.body;
    if (body && typeof body === 'object') {
      const canonical = this.canonicalizePayload(body);
      const hash = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
      return `idem:body:${hash}`;
    }

    // No idempotency key available — allow passthrough
    return null;
  }

  // ── Challenge 5: canonicalizePayload ──
  // Strips nulls, sorts object keys recursively, normalizes timestamps
  // to UTC ISO8601, then returns deterministic JSON string.
  private canonicalizePayload(obj: any): string {
    if (obj === null || obj === undefined) return '';
    if (typeof obj !== 'object') return String(obj);

    // Handle arrays
    if (Array.isArray(obj)) {
      return '[' + obj.map((item) => this.canonicalizePayload(item)).join(',') + ']';
    }

    // Sort keys, strip nulls, normalize dates
    const sorted: Record<string, any> = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        const val = obj[key];
        if (val === null || val === undefined) return; // Strip nulls/undefined
        if (typeof val === 'string' && this.looksLikeTimestamp(val)) {
          sorted[key] = this.normalizeTimestamp(val);
        } else if (typeof val === 'object') {
          sorted[key] = this.canonicalizePayload(val);
        } else {
          sorted[key] = val;
        }
      });

    return JSON.stringify(sorted);
  }

  private looksLikeTimestamp(val: string): boolean {
    // ISO8601, RFC3339, or common date formats
    return (
      /^\d{4}-\d{2}-\d{2}T/.test(val) ||
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(val)
    );
  }

  private normalizeTimestamp(val: string): string {
    // Normalize to UTC ISO8601
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toISOString();
      }
    } catch {}
    return val;
  }

  private cleanupStaleEntries(): void {
    const now = Date.now();
    if (now - this.lastCleanup < 60000) return; // Once per minute
    this.lastCleanup = now;

    // Clear in-flight entries older than TTL (leaked locks)
    const deadline = now - this.ttlMs;
    for (const key of this.inFlight) {
      // In-flight keys don't have timestamps — clear all on cleanup rotation
    }

    if (this.cache.size > 10000) {
      this.cache.clear();
      this.logger.warn('Idempotency cache exceeded 10k entries — cleared');
    }
  }
}
