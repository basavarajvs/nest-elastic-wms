import { Injectable, Logger } from '@nestjs/common';
import { Histogram, Gauge, Counter, register } from 'prom-client';

const TENANT_GROUP_MAP = new Map<string, string>();

@Injectable()
export class WmsMetricsService {
  private readonly logger = new Logger(WmsMetricsService.name);

  readonly rfScanDuration: Histogram<string>;
  readonly dbQueryDuration: Histogram<string>;
  readonly queueJobDuration: Histogram<string>;
  readonly queueJobCounter: Counter<string>;
  readonly quotaUsage: Gauge<string>;
  readonly integrationApiCalls: Counter<string>;
  readonly webhookLatency: Histogram<string>;
  readonly scannerLookupLatency: Histogram<string>;
  readonly activeConnections: Gauge<string>;

  private readonly CARDINALITY_LIMIT = 100;
  private tenantGroupsObserved = new Set<string>();

  constructor() {
    this.rfScanDuration = new Histogram({
      name: 'wms_rf_scan_duration_seconds',
      help: 'RF barcode scan validation latency',
      labelNames: ['context', 'tenant_group'],
      buckets: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5],
    });

    this.dbQueryDuration = new Histogram({
      name: 'wms_db_query_duration_seconds',
      help: 'Prisma query execution time',
      labelNames: ['model', 'operation', 'tenant_group'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
    });

    this.queueJobDuration = new Histogram({
      name: 'wms_queue_job_duration_seconds',
      help: 'BullMQ job processing time',
      labelNames: ['queueName', 'status', 'tenant_group'],
      buckets: [0.5, 1, 5, 10, 30, 60],
    });

    this.queueJobCounter = new Counter({
      name: 'wms_queue_jobs_total',
      help: 'Total BullMQ jobs processed',
      labelNames: ['queueName', 'status', 'tenant_group'],
    });

    this.quotaUsage = new Gauge({
      name: 'wms_quota_usage_percent',
      help: 'Current quota usage percentage',
      labelNames: ['resourceType', 'tenant_group'],
    });

    this.integrationApiCalls = new Counter({
      name: 'wms_integration_api_calls_total',
      help: 'External integration API call count',
      labelNames: ['platform', 'operation', 'tenant_group'],
    });

    this.webhookLatency = new Histogram({
      name: 'wms_webhook_latency_seconds',
      help: 'Webhook processing latency',
      labelNames: ['platform', 'tenant_group'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });

    this.scannerLookupLatency = new Histogram({
      name: 'wms_scanner_lookup_duration_seconds',
      help: 'Scanner barcode lookup latency',
      labelNames: ['context', 'tenant_group'],
      buckets: [0.01, 0.02, 0.05, 0.1, 0.2],
    });

    this.activeConnections = new Gauge({
      name: 'wms_active_db_connections',
      help: 'Active database connections',
      labelNames: ['state'],
    });
  }

  resolveTenantGroup(tenantId: string): string {
    const cached = TENANT_GROUP_MAP.get(tenantId);
    if (cached) return cached;

    this.tenantGroupsObserved.add(tenantId);

    if (this.tenantGroupsObserved.size > this.CARDINALITY_LIMIT) {
      return 'tier_aggregated';
    }

    const group = this.classifyTenant(tenantId);
    TENANT_GROUP_MAP.set(tenantId, group);
    return group;
  }

  private classifyTenant(_tenantId: string): string {
    return 'tier_pro';
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  checkCardinality(): boolean {
    return this.tenantGroupsObserved.size <= this.CARDINALITY_LIMIT;
  }
}
