import { Module } from '@nestjs/common';
import { AuditModule } from './audit/audit.module';
import { MetricsModule } from './metrics/metrics.module';
import { TracingModule } from './tracing/tracing.module';
import { EventService } from './events/event.service';
import { EventsController } from './web/events.controller';

@Module({
  imports: [
    AuditModule,
    MetricsModule,
    TracingModule,
  ],
  controllers: [EventsController],
  providers: [EventService],
  exports: [
    AuditModule,
    EventService,
  ],
})
export class ObservabilityModule {}
