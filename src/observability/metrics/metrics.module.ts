import { Global, Module } from '@nestjs/common';
import { PrometheusModule, makeCounterProvider, makeGaugeProvider } from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      path: process.env.METRICS_PATH || '/metrics',
      defaultMetrics: { enabled: true },
    }),
  ],
  providers: [
    makeCounterProvider({
      name: 'wms_http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'path', 'status'],
    }),
    makeGaugeProvider({
      name: 'wms_queue_depth',
      help: 'Current queue depth',
      labelNames: ['queue_name'],
    }),
    makeGaugeProvider({
      name: 'wms_db_pool_utilization',
      help: 'Database pool utilization',
      labelNames: ['pool_name'],
    }),
    MetricsService,
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
