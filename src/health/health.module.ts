import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { NotificationModule } from '../notifications/notification.module';
import { ReportsModule } from '../reports/reports.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { ScannerModule } from '../scanner/scanner.module';

@Module({
  imports: [NotificationModule, ReportsModule, IntegrationsModule, ScannerModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
