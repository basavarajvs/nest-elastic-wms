# Phase 15 — SaaS Core Integration & Cross-Cutting

**Goal:** Core API client, quota enforcement, role/UOM seeding, graceful shutdown, cluster mode, permission bootstrap validation.

**Depends on:** P0 (Redis, BullMQ, axios), all prior phases (seeders reference existing data)

---

## Models (0 existing, 1 new table)

### New Table to CREATE

| # | Model | Table | Fields | Key Indexes |
|---|-------|-------|--------|-------------|
| 1 | ResourceQuota | `resource_quotas` | id(UUID), tenantId(UUID), resourceType(VARCHAR100), limitAmount(INT), currentUsage(INT DEFAULT 0), updatedAt(TIMESTAMPTZ) | `resource_quotas_type_uq(tenantId,resourceType)` |

**Migration SQL:**
```sql
CREATE TABLE multitenant.resource_quotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  limit_amount INTEGER NOT NULL,
  current_usage INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, resource_type)
);
```

---

## Module Structure

```
src/core-client/
├── core-client.module.ts          # @Global()
├── core-client.service.ts
└── wms-role.dto.ts

src/quota/
├── quota.module.ts                # @Global()
├── quota-init.service.ts
├── quota-sync-retry.processor.ts
├── quota-sync.constants.ts
├── common/guards/quota.guard.ts
└── common/decorators/quota-check.decorator.ts

src/seed/
├── seed.module.ts
├── wms-role-seeder.service.ts
└── uom-seeder.service.ts

src/lifecycle/
├── lifecycle.module.ts
├── shutdown.service.ts
└── common/middleware/shutdown-drain.middleware.ts

src/cluster/
├── cluster.module.ts
└── cluster.service.ts
```

---

## CoreClientService

```typescript
@Injectable()
export class CoreClientService {
  private readonly http: AxiosInstance;

  constructor(config: ConfigService) {
    this.http = axios.create({
      baseURL: config.get('CORE_API_URL'),
      headers: {
        Authorization: `Bearer ${config.get('CORE_API_TOKEN')}`,
        'X-System-Token': config.get('CORE_API_TOKEN'),
      },
    });
    // Response interceptor: log 401/403 as error, 5xx as warning
  }

  async getPlanLimits(tenantId: string): Promise<PlanLimits> { ... }
  async seedWmsRoles(tenantId: string, roles: WmsRoleDto[]): Promise<void> { ... }
  async assignPermissions(roleId: string, permissions: string[]): Promise<void> { ... }
  async healthCheck(): Promise<boolean> { ... }
  async dispatchNotification(payload: any): Promise<void> { ... }

  // Retry helper: 3 attempts, linear backoff 1s/2s/3s
  // Skip retry on 401/403 (throw HttpException BAD_GATEWAY immediately)
}
```

## Quota System

### QuotaInitService
- `onModuleInit()` → `syncQuotasForAllTenants()`
- Calls `CoreClientService.getPlanLimits(tenantId)`
- Upserts into `ResourceQuota` per resource type
- If usage >80%, emits `quota.warning` event
- On failure, enqueues to `quota-sync-retry` BullMQ queue

### QuotaGuard (global APP_GUARD)
- Reads `@QuotaCheck(resourceType)` metadata from handler
- Looks up `ResourceQuota.currentUsage` vs `limitAmount`
- Throws `QuotaExceededException` if usage >= limit

### QuotaCheck Decorator
```typescript
export const QUOTA_CHECK_KEY = 'quota_check';
export const QuotaCheck = (resourceType: string) => SetMetadata(QUOTA_CHECK_KEY, resourceType);
```

### QuotaSyncRetryProcessor (BullMQ WorkerHost)
- Process `'quota-sync-retry'` queue jobs
- Retries `syncQuotasFromCore()` with BullMQ exponential backoff
- Logs final failure on exhausted retries

## Seed Services

### WmsRoleSeederService
- On tenant provision: build `WmsRoleDto[]` from `WMS_ROLE_DEFINITIONS`
- Call `CoreClientService.seedWmsRoles(tenantId, roles)`
- Then `assignPermissions()` for each role

### UomSeederService
- Seeds standard UOMs (EA, CS, PL, KG, LB, L, GAL, etc.) on tenant provision

## LifecycleModule

### ShutdownService
- Listens for `SIGTERM`/`SIGINT`
- Drains active BullMQ jobs
- Pauses all queues
- Closes Redis connection
- Disconnects Prisma
- Calls `app.close()` with timeout (`SHUTDOWN_TIMEOUT_MS`)

### ShutdownDrainMiddleware
- During shutdown: reject non-RF requests with 503
- Allow RF requests to complete (handheld terminals timeout-sensitive)

## ClusterModule

- Multi-instance coordination via Redis:
  - **Mutex** for migrations (only one instance runs them)
  - **Leader election** for cron jobs
  - Redis pub/sub for cache invalidation across nodes

## Bootstrap Permission Validation

On app startup, validate that all subjects in `WMS_ROLE_DEFINITIONS` exist in `ALL_WMS_SUBJECTS`. Log warning if any are missing.

## BullMQ Queues

- `quota-sync-retry` — retry failed quota syncs

## CASL Subjects to Add

`'ResourceQuota' | 'Quota'`

## Tenant Isolation — Add to `hasTenantId()`

`ResourceQuota` (and all models from previous phases).

## Tests

| Test | File |
|------|------|
| CoreClientService HTTP calls + retry | `core-client/core-client.service.spec.ts` |
| Quota sync + guard enforcement | `quota/quota-init.service.spec.ts` |
| QuotaExceededException on overage | `quota/quota.guard.spec.ts` |
| ShutdownService graceful drain | `lifecycle/shutdown.service.spec.ts` |
| WmsRoleSeeder builds correct DTOs | `seed/wms-role-seeder.service.spec.ts` |
| UomSeeder creates standard UOMs | `seed/uom-seeder.service.spec.ts` |
