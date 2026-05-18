import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimiterFailoverService } from './rate-limiter-failover.service';
import { RfRateLimiterGuard } from './rf-rate-limiter.guard';

const THROTTLE_LIMITS: Record<string, { limit: number; ttl: number }> = {
  global: { limit: 100, ttl: 60000 },
  rf_scanner: { limit: 50, ttl: 1000 },
  auth: { limit: 10, ttl: 60000 },
  webhook: { limit: 500, ttl: 60000 },
};

@Injectable()
export class WmsThrottlerGuard {
  constructor(
    private readonly reflector: Reflector,
    private readonly failoverService: RateLimiterFailoverService,
    private readonly rfRateLimiter: RfRateLimiterGuard,
  ) {}

  async canActivate(context: any): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const url: string = req?.url || '';

    if (url.includes('/rf/')) {
      const deviceId = req.headers?.['x-device-id'] as string || 'unknown';
      const ip = req.ip || 'unknown';
      const result = await this.rfRateLimiter.checkCompositeKey(ip, deviceId);
      if (!result.allowed) {
        throw new HttpException(
          { statusCode: 429, error: 'Too Many Requests', message: 'RF rate limit exceeded', retryAfterMs: result.retryAfterMs },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      return true;
    }

    if (url.includes('/auth') || url.includes('/login')) {
      return this.checkLimit(req, 'auth');
    }

    if (url.includes('/webhooks')) {
      return this.checkLimit(req, 'webhook');
    }

    return this.checkLimit(req, 'global');
  }

  private async checkLimit(req: any, name: string): Promise<boolean> {
    const { limit, ttl } = THROTTLE_LIMITS[name] || THROTTLE_LIMITS.global;
    const ip = req.ip || 'unknown';
    const key = `throttle:${name}:${ip}`;

    const result = await this.failoverService.check(key, limit, ttl);
    if (!result.allowed) {
      throw new HttpException(
        {
          statusCode: 429,
          error: 'Too Many Requests',
          message: `Rate limit exceeded: ${limit} per ${ttl / 1000}s`,
          retryAfterMs: result.retryAfterMs,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
