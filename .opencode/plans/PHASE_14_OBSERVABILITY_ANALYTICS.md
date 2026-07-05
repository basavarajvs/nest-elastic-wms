# Phase 14 — Observability, Analytics & Audit

**Goal:** Prometheus metrics, OpenTelemetry tracing, KPI/heatmap analytics, audit logging.

**Depends on:** P0 (OpenTelemetry SDK, Prometheus packages), P4 (outbound for pick heatmaps), P3 (inventory for KPIs)

---

## Models (11 existing, 0 new tables)

| # | Schema Model | Table Name | Module |
|---|-------------|------------|--------|
| 1 | daily_kpi_metrics | `daily_kpi_metrics` | analytics/kpi |
| 2 | location_pick_heatmap | `location_pick_heatmap` | analytics/heatmap |
| 3 | system_audit_log | `system_audit_log` | observability/audit |
| 4 | warehouse_events | `warehouse_events` | observability/events |

(Note: Fulfillment workflow models are in P11, not here)

---

## Module Structure

```
src/observability/
├── observability.module.ts
├── audit/
│   ├── audit.module.ts
│   ├── audit.service.ts
│   ├── audit.interceptor.ts
│   ├── web/audit.controller.ts
│   └── dtos/
├── tracing/
│   ├── tracing.module.ts
│   ├── tracing.service.ts
│   └── otlp-exporter.ts
├── metrics/
│   ├── metrics.module.ts
│   └── metrics.service.ts

src/analytics/
├── analytics.module.ts
├── kpi/
│   ├── kpi.service.ts
│   ├── web/kpi.controller.ts
│   └── dtos/
├── heatmap/
│   ├── heatmap.service.ts
│   ├── web/heatmap.controller.ts
│   └── dtos/
```

## Web Endpoints

| Domain | Method | Path | CASL Subject |
|--------|--------|------|-------------|
| Audit Logs | GET | `/web/audit-logs` (filterable) | SystemAuditLog |
| Events | GET | `/web/events` (filterable) | WarehouseEvent |
| Events | GET | `/web/events/:id` | WarehouseEvent |
| KPI Daily | GET | `/web/analytics/kpi/daily` | DailyKpiMetric |
| KPI Summary | GET | `/web/analytics/kpi/summary` | DailyKpiMetric |
| Pick Heatmap | GET | `/web/analytics/heatmap/pick` | LocationPickHeatmap |
| Top Locations | GET | `/web/analytics/heatmap/locations/top` | LocationPickHeatmap |

## Observability Setup

### Prometheus Metrics
```typescript
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
PrometheusModule.register({
  path: process.env.METRICS_PATH || '/metrics',
  defaultMetrics: { enabled: true },
});
```

Custom metrics:
- `wms_http_requests_total` — throughput per endpoint
- `wms_queue_depth` — BullMQ queue depths
- `wms_db_pool_utilization` — DB pool usage

### OpenTelemetry Tracing
```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis-4';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: process.env.OTLP_ENDPOINT }),
  instrumentations: [
    new HttpInstrumentation(),
    new PgInstrumentation(),
    new RedisInstrumentation(),
  ],
});
sdk.start();
```

### AuditInterceptor
- Global APP_INTERCEPTOR
- Reads `@AuditLog()` metadata from matched route
- On response success: writes `{ tenantId, userId, action, entity, entityId, oldValue, newValue }` to `system_audit_log`
- On error: does not write (errors handled by ExceptionFilter)

### AuditLog Decorator
```typescript
export const AUDIT_LOG_KEY = 'audit_log';
export const AuditLog = (opts: { eventType: string; detail?: (req: any, body: any) => string }) =>
  SetMetadata(AUDIT_LOG_KEY, opts);
```

## CASL Subjects to Add

`'DailyKpiMetric' | 'LocationPickHeatmap' | 'WarehouseEvent' | 'SystemAuditLog'`

## Tenant Isolation — Add to `hasTenantId()`

All 4 existing models.

## Tests

| Test | File |
|------|------|
| KPI query + aggregate summary | `analytics/kpi/kpi.service.spec.ts` |
| Heatmap query + top locations | `analytics/heatmap/heatmap.service.spec.ts` |
| Audit log write + query | `observability/audit/audit.service.spec.ts` |
| Warehouse event publish + query | `observability/audit/warehouse-event.service.spec.ts` |
