import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('wms_http_requests_total') private readonly httpRequestsTotal: Counter<string>,
    @InjectMetric('wms_queue_depth') private readonly queueDepth: Gauge<string>,
    @InjectMetric('wms_db_pool_utilization') private readonly dbPoolUtilization: Gauge<string>,
  ) {}

  incrementHttpRequest(method: string, path: string, status: number): void {
    this.httpRequestsTotal.labels(method, path, String(status)).inc();
  }

  setQueueDepth(queueName: string, depth: number): void {
    this.queueDepth.labels(queueName).set(depth);
  }

  setDbPoolUtilization(poolName: string, utilization: number): void {
    this.dbPoolUtilization.labels(poolName).set(utilization);
  }
}
