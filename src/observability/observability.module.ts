import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { WmsMetricsService } from './wms-metrics.service';
import { LogLevelService } from './log-level.service';
import { DbPoolMonitorService } from './db-pool-monitor.service';
import { BullmqStalledHandler } from './bullmq-stalled.handler';
import { WorkerHeapMonitor } from './worker-heap-monitor';
import { EventLeakDetectorService } from './event-leak-detector.service';
import { DynamicListenerRegistry } from './dynamic-listener-registry';
import { BackpressureService } from './backpressure.service';

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
        config: { prefix: 'wms_' },
      },
    }),
  ],
  providers: [
    WmsMetricsService,
    LogLevelService,
    DbPoolMonitorService,
    BullmqStalledHandler,
    WorkerHeapMonitor,
    EventLeakDetectorService,
    DynamicListenerRegistry,
    BackpressureService,
  ],
  exports: [
    WmsMetricsService,
    LogLevelService,
    DbPoolMonitorService,
    BullmqStalledHandler,
    WorkerHeapMonitor,
    EventLeakDetectorService,
    DynamicListenerRegistry,
    BackpressureService,
  ],
})
export class ObservabilityModule {}
