# WMS Production Cutover Playbook

## Overview
Zero-downtime cutover from v1 (blue) to v2 (green) for the WMS application.
Designed for RF-first warehouse operations — no scan data loss during deployment.

## Pre-Cutover Checklist

### Application Readiness
- [ ] E2E tests pass on staging: `pnpm run test:e2e`
- [ ] k6 load tests meet p95 thresholds: `pnpm run load:test`
- [ ] `pnpm run lint` — zero warnings
- [ ] `npx tsc --noEmit` — zero errors
- [ ] Prisma migration applied on staging with no errors
- [ ] OpenAPI spec validated: spec diff shows expected changes only

### Infrastructure Readiness
- [ ] DB connection pool validated under 2x expected load
- [ ] Redis cluster ping < 5ms across all nodes
- [ ] BullMQ queues drained of stale jobs
- [ ] RF devices tested on warehouse Wi-Fi (5GHz + 2.4GHz failover)
- [ ] Core API rate limits configured for `X-System-Token`
- [ ] Docker images pushed to registry with unique tag

### Data & State
- [ ] Rollback snapshot taken:
  - `pg_dump -Fc -f pre-cutover.dump`
  - `redis-cli SAVE` + copy `dump.rdb`
- [ ] `wms_migration_status` shows all pending migrations as `completed`
- [ ] `_prisma_migrations` has no failed migrations

### Communication
- [ ] RF operators notified of maintenance window (15 min, off-peak)
- [ ] Stakeholders added to monitoring Slack channel
- [ ] PagerDuty on-call engineer briefed on rollback procedure

## DNS & Traffic Switch

### Step 1 — Deploy v2 (green)
```bash
# Apply ConfigMap and Secrets
kubectl apply -f deploy/k8s/secrets-hpa.yaml
kubectl apply -f deploy/k8s/deployment.yaml

# Wait for green pods to be ready
kubectl rollout status deployment/wms-app-v2 --timeout=300s
```

### Step 2 — Verify green health
```bash
# Health check
curl -sf https://green.wms.internal/health
curl -sf https://green.wms.internal/health/ready

# Smoke test — RF scan
curl -s -X POST https://green.wms.internal/rf/validate \
  -H 'X-Tenant-Code: SMOKE-TEST' \
  -H 'X-Device-Id: SMOKE-DEVICE' \
  -d '{"barcode": "SMOKE-BC-001"}' | jq .

# Metrics
curl -sf https://green.wms.internal/metrics | head -20
```

### Step 3 — 50% traffic shift
```bash
# Update load balancer target group weights
# Blue: 50%, Green: 50%
# Monitor for 5 minutes
```

### Step 4 — 100% traffic shift
```bash
# Blue: 0%, Green: 100%
# Expect DNS TTL = 300s (5 minutes) for fast revert
```

### Step 5 — Drain blue pods
```bash
# Send SIGTERM to blue pods
kubectl delete deployment wms-app-v1

# ── Challenge 4: maintenance-proxy for RF during drain ──
# Blue pods' maintenance-proxy returns 202 Accepted with Retry-After
# for /rf/* endpoints during graceful drain (terminationGracePeriodSeconds: 30).
# Fastify keepAliveTimeout: 5000, headersTimeout: 6000 ensure stale
# connections are rejected cleanly without crashing the draining process.
```

## Cache Warm-Up

```bash
# Run post-deploy cache warm-up (Challenge 6)
pnpm run warmup:cache

# Expected: cache hit ratio > 90% within 5 minutes
# Redis Config:
#   maxmemory 512mb
#   maxmemory-policy allkeys-lru
# Cache TTL decay:
#   Warm-up phase (0-5 min): 15m TTL
#   Steady state (after 5 min): 2h TTL
# Monitor: redis.memory.used vs evicted_keys to prevent OOM
```

## Rollback Procedure

### Trigger Conditions
Any of the following sustained for > 30 seconds:
- Error rate > 1% (HTTP 5xx)
- p95 latency > 200ms
- RLS violation detected
- DB pool saturation (> 100% for 5s)
- Redis eviction rate > 100 keys/min during peak

### Rollback Steps

#### 1. Revert DNS/LB to v1 (blue)
```bash
# Blue: 100%, Green: 0%
# Within 60s all traffic is back on v1
```

#### 2. Scale down v2 pods
```bash
kubectl scale deployment wms-app-v2 --replicas=0
```

#### 3. Restore database (if schema changed)
```bash
# Restore from pre-migration snapshot
pg_restore -Fc -d elasticwms pre-cutover.dump

# Run migration rollback
psql $DATABASE_URL -c "
  UPDATE _prisma_migrations SET migration_status = 'rolled_back'
  WHERE migration_name LIKE '%_v2_%';
"
```

#### 4. Replay idempotent BullMQ jobs from DLQ
```bash
# Move DLQ jobs back to main queue
pnpm run replay:dlq

# Verify queue depths normalize
```

#### 5. Notify operators
```bash
# In-app banner: "System temporarily reverting to v1. No scan data lost."
# RF sessions remain valid due to Redis session TTL (12h)
```

## Post-Cutover Monitoring

### Grafana Dashboard: `wms-production-cutover`

| Panel | Metric | Target | Alert |
|---|---|---|---|
| HTTP 4xx rate | `http_requests_total{status=~"4.."}` | < 1% | > 2% |
| HTTP 5xx rate | `http_requests_total{status=~"5.."}` | < 0.1% | > 1% |
| DB pool active | `wms_active_db_connections` | < 80% | > 80% |
| Redis hit ratio | `redis_hits / (redis_hits + redis_misses)` | > 90% | < 80% |
| BullMQ stalled | `wms_queue_jobs_total{state="stalled"}` | 0 | > 1 |
| RF session timeout | `rf_session_timeouts_total` | 0 | > 1 |
| Quota utilization | `wms_quota_usage_percent` | < 80% | > 90% |
| Cache eviction | `redis_evicted_keys_total` | < 10/min | > 100/min |

### PagerDuty/Slack Alert Thresholds
- Sustained 5xx > 30s → P1
- DB pool > 80% → P2
- Redis eviction > 100/min → P2
- RLS violation → P0 (immediate rollback)

### Post-Cutover Verification (24h)
- [ ] Grafana shows clean baseline within 10 min of switch
- [ ] RF operators report zero session loss
- [ ] Scans resume automatically on reconnect
- [ ] BullMQ queue depth < 100
- [ ] Redis memory stable (< 400mb)
- [ ] No PagerDuty alerts triggered

## Maintenance Proxy Configuration

### Fastify keepAliveTimeout & headersTimeout
```typescript
// main.ts — Challenge 4
const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({
  logger,
  bodyLimit: 10 * 1024 * 1024,
  keepAliveTimeout: 5000,       // 5s — graceful stale connection rejection
  headersTimeout: 6000,         // 6s — reject incomplete headers before keepAlive
  maxRequestsPerSocket: 100,    // Reset connection every 100 requests
}));
```

### Maintenance Proxy (v1 during drain)
```typescript
// Returns 202 with Retry-After for RF endpoints during SIGTERM drain
fastifyInstance.addHook('onRequest', async (req, reply) => {
  if (isDraining && req.url.startsWith('/rf/')) {
    return reply.status(202).send({
      status: 'accepted',
      message: 'System is draining — retry in 2s',
      retryAfterMs: 2000,
      sessionId: req.headers['x-session-id'],
    });
  }
});
```
