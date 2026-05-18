import { Module } from '@nestjs/common';
import { ScannerAuthService } from './scanner-auth.service';
import { ScannerTelemetryService } from './scanner-telemetry.service';
import { ScannerAuthGuard } from './guards/scanner-auth.guard';
import { ScannerController } from './scanner.controller';
import { TokenBucketRateLimiter } from '../common/rate-limiter/token-bucket.rate-limiter';

@Module({
  controllers: [ScannerController],
  providers: [
    ScannerAuthService,
    ScannerTelemetryService,
    ScannerAuthGuard,
    TokenBucketRateLimiter,
  ],
  exports: [
    ScannerAuthService,
    ScannerTelemetryService,
    ScannerAuthGuard,
    TokenBucketRateLimiter,
  ],
})
export class ScannerModule {}
