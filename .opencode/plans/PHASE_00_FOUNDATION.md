# Phase 0 — Foundation Infrastructure

**Goal:** Complete all cross-cutting infrastructure so feature modules can be built on a solid foundation.

**Dependency:** None (starting phase)

---

## 1. Missing NPM Dependencies

```bash
pnpm add @nestjs/bullmq bullmq ioredis
pnpm add @fastify/helmet @fastify/rate-limit
pnpm add @nestjs/event-emitter @nestjs/schedule
pnpm add axios uuid
pnpm add -D jest @types/jest ts-jest supertest @types/supertest @types/uuid
```

## 2. RedisModule (Cache Layer)

**File:** `src/common/cache/redis.module.ts`

@Global() module providing `'REDIS_CLIENT'` (ioredis instance).

**Cache conventions:**
| Prefix | TTL | Purpose |
|--------|-----|---------|
| `wms:sm:` | 300s | State machine defs |
| `wms:rule:` | 300s | Rule engine defs |
| `wms:barcode:` | 900→7200s | Barcode lookups |
| `wms:session:` | configurable | Session data |
| `wms:facility:` | 300s | Facility configs |
| `wms:idempotency:` | IDEMPOTENCY_TTL_MS | Idempotency keys |

## 3. BullModule (Queue Backend)

**In `app.module.ts`:** `BullModule.forRootAsync()` with ioredis connection.

```typescript
BullModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    connection: {
      host: config.get('REDIS_HOST'),
      port: config.get('REDIS_PORT'),
      password: config.get('REDIS_PASSWORD'),
    },
    defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    limiter: { max: 50, duration: 5000 },
  }),
  inject: [ConfigService],
}),
```

## 4. PrismaService — Tenant Isolation Middleware

**Modify:** `src/prisma/prisma.service.ts`

Inject `TenantContextService`. Add `$use()` middleware in `onModuleInit()`:
- Inject `tenantId` into `where` for findUnique/findFirst/findMany/count/aggregate/update/updateMany/upsert/delete/deleteMany
- Inject `tenantId` into `data` for create/createMany
- `SELECT set_config('app.tenant_id', $1, true)` for RLS
- Log slow queries (>100ms)
- Skip if `store?.isSystemContext` or model not in `hasTenantId()`
- PgBouncer mode: wrap mutations in `$transaction`

**`hasTenantId()`** — empty array initially, expanded per phase as models are added.

## 5. Security: @fastify/helmet

```typescript
await app.register(helmet, {
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
});
```

## 6. Rate Limiting: @fastify/rate-limit

```typescript
const redisClient = app.get('REDIS_CLIENT');
await app.register(rateLimit, {
  redis: redisClient,
  global: true,
  max: Number(process.env.RATE_LIMIT_GLOBAL_LIMIT) || 100,
  timeWindow: Number(process.env.RATE_LIMIT_GLOBAL_TTL) || 60000,
});
```

## 7. Event Bus: @nestjs/event-emitter

`EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' })`

## 8. Scheduling: @nestjs/schedule

`ScheduleModule.forRoot()`

## 9. Missing Interceptors (all APP_INTERCEPTOR)

| Interceptor | File | Purpose |
|-------------|------|---------|
| PiiRedactorInterceptor | `src/common/interceptors/` | Redact emails/phones/tokens in prod |
| RequestSemaphoreInterceptor | `src/common/interceptors/` | Gate DB at 80% pool → 503 |
| IdempotencyInterceptor | `src/common/interceptors/` | Dedup POST/PATCH via Idempotency-Key + SHA256 |

## 10. Missing Decorators

| Decorator | Phase | Notes |
|-----------|-------|-------|
| `@CurrentTenant()` | P0 | Inject `req.tenantContext` |
| `@RfAction()` | P13 | For RF route guards |
| `@AuditLog()` | P14 | Auto-log to system_audit_log |
| `@QuotaCheck()` | P15 | Quota enforcement |
| `@HoldOverride()` | P13 | Supervisor PIN override |

All use `SetMetadata` from `@nestjs/common`.

## 11. TenantResolutionMiddleware

Reads `req.user?.tenantId` → calls `tenantContext.set()`. Registered globally via `AppModule.configure()`.

## 12. Health Check — Expand

Add Redis ping. Return `{ status, modules: { database, redis } }`.

## 13. Test Setup

Jest config, `test/jest-e2e.json`, update `package.json` scripts.

## 14. Verification

```bash
pnpm run build
node dist/main.js &
curl http://localhost:3001/api/v1/wms/health              # → all modules "connected"
curl -o /dev/null -w "%{http_code}" http://localhost:3001/api/docs  # → 200
```

---

## Files Created/Modified

| File | Action |
|------|--------|
| `src/common/cache/redis.module.ts` | CREATE |
| `src/prisma/prisma.service.ts` | MODIFY |
| `src/common/interceptors/pii-redactor.interceptor.ts` | CREATE |
| `src/common/interceptors/request-semaphore.interceptor.ts` | CREATE |
| `src/common/interceptors/idempotency.interceptor.ts` | CREATE |
| `src/common/decorators/current-tenant.decorator.ts` | CREATE |
| `src/common/middleware/tenant-resolution.middleware.ts` | CREATE |
| `src/app.module.ts` | MODIFY |
| `src/main.ts` | MODIFY |
| `src/health/web/health.controller.ts` | MODIFY |
| `test/jest-e2e.json` | CREATE |
| `package.json` | MODIFY |
