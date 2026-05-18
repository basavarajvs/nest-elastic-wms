import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { WmsThrottlerGuard } from './wms-throttler.guard';
import { RfRateLimiterGuard } from './rf-rate-limiter.guard';
import { RateLimiterFailoverService } from './rate-limiter-failover.service';
import { SwaggerDocsGuard } from './swagger-docs.guard';
import { TenantCodeAuthGuard } from './tenant-code-auth.guard';

@Global()
@Module({
  providers: [
    RateLimiterFailoverService,
    SwaggerDocsGuard,
    TenantCodeAuthGuard,
    RfRateLimiterGuard,
    {
      provide: APP_GUARD,
      useClass: WmsThrottlerGuard,
    },
  ],
  exports: [
    RateLimiterFailoverService,
    SwaggerDocsGuard,
    TenantCodeAuthGuard,
    RfRateLimiterGuard,
    WmsThrottlerGuard,
  ],
})
export class SecurityModule {}
