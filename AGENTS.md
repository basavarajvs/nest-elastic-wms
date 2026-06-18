# WMS App — Agent Notes

## Startup Verification
```bash
pnpm run build && node dist/src/main.js
```
- App starts, all modules initialize, all routes register cleanly
- **Verify**: `curl http://localhost:3001/health` → 200, `curl http://localhost:3001/api/docs` → 200 (Swagger UI)

## Key Fixes History
- **QUOTA_SYNC_QUEUE circular import**: Extracted to `src/quota/quota-sync.constants.ts`; `quota.module.ts` now imports BullModule.registerQueue; removed duplicate registerQueue from `app.module.ts`
- **Cross-module DI**: Added missing `InventoryModule` imports in `InboundModule` and `TransfersModule`; added `NotificationModule`, `ReportsModule`, `IntegrationsModule`, `ScannerModule` imports in `HealthModule`
- **BullModule re-exports**: Added `BullModule` to exports of `NotificationModule`, `ReportsModule`, `IntegrationsModule` so queue tokens are accessible to importing modules
- **RfSessionModule @Global**: Made global since `RfSessionGuard` is used by almost every feature module
- **LifecycleModule**: Created to provide `ShutdownService` globally; removed from AppModule providers
- **fastify-helmet → @fastify/helmet**: Replaced deprecated `fastify-helmet@7` (Fastify v3 only) with `@fastify/helmet@13` (Fastify v5 compatible)
- **@fastify/rate-limit redis**: Pass ioredis instance instead of config object (v10 requires ioredis instance with `defineCommand`)
- **LogLevelService.setPinoInstance**: Changed `(fastifyInstance as any).logger` → `(fastifyInstance as any).log` (Fastify v5 uses `.log` not `.logger`); moved after `app.listen()`
- **Redis password**: Added `REDIS_PASSWORD=redis123` to `.env`; passed to rate-limit Redis config
- **npm start**: Changed `"nest start"` to `"pnpm run build && node dist/src/main.js"` (postbuild needed for Prisma client copy)
- **Duplicate route `GET /api/v1/wms/web`**: Renamed `WarehouseFacilityController` to `@Get('web/facilities')`/`@Get('rf/facilities')` and `WarehouseZoneController` to `@Get('web/zones')`/`@Get('rf/zones')`; `StorageLocationController` keeps root `@Get('web')`/`@Get('rf')`
- **Swagger UI 404**: Added `SWAGGER_ENABLED=true` to `.env` (Joi schema defaults to `false`); installed `@fastify/static` (required by SwaggerModule with Fastify)
- **Missing DB tables (P2021)**: Created migration `0014_add_missing_tables` creating 9 missing tables (`db_rf_sessions`, `wms_execution_instances`, `wms_state_machines`, `wms_rules`, `wms_bpmn_processes`, `system_settings`, `supervisor_pins`, `inspections`, `qc_dispositions`) plus enums `EngineType`/`ExecutionStatus`. Also marked migrations 0001–0008 as applied via `prisma migrate resolve --applied` (they were never applied; tables existed from `prisma db push`).
- **MigrationStatusService table not created**: Added `OnApplicationBootstrap` hook to `MigrationStatusService` to call `ensureMigrationStatusTable()` during startup.

## Reorganisation — Domain Grouping (2026-05-30)
- **Goal**: Group P0/P2 modules by warehouse domain instead of flat `src/` structure
- **Moved into `src/master-data/`**: brands, carriers, clients, vendors, products (existing), product-packaging, product-suppliers
- **Moved into `src/inbound/`**: purchase-orders, customer-returns
- **Moved into `src/outbound/`**: loads, shipping-labels
- **Moved into `src/inventory/`**: inventory-reservations, counts (existing cycle-counts)
- **Moved into `src/warehouse/`**: lpn
- **Import fix**: Updated all relative `../prisma/` → `../../prisma/` and `../../common/` → `../../../common/` paths in moved modules
- **`src/app.module.ts`**: Updated 18 module import paths; no functional changes

## Current Directory Structure

```
src/
├── @types/
├── approvals/         (web/, dtos/)
├── casl/
├── cluster/
├── common/            (auth, cache, context, decorators, exceptions, filters, guards, interceptors, middleware, rate-limiter)
├── config/
├── core-client/
├── customization/     (web/, dtos/, guards/)
├── health/
├── inbound/           (purchase-orders/, customer-returns/, web/, rf/, dtos/)
├── integrations/      (adapters/, processors/, webhooks/, dtos/)
├── inventory/         (counts/, inventory-reservations/, web/, rf/, dtos/)
├── lifecycle/
├── master-data/       (brands/, carriers/, clients/, products/, product-packaging/, product-suppliers/, vendors/)
├── notifications/     (web/, rf/, guards/, listeners/)
├── observability/
├── outbound/          (loads/, shipping-labels/, web/, rf/, dtos/)
├── prisma/
├── quota/
├── reports/           (web/, dtos/)
├── rf/
├── scanner/           (guards/)
├── security/
├── seed/
├── test/
├── transfers/         (web/, rf/, dtos/)
└── warehouse/         (lpn/, dtos/)
```

## P2 Enhanced Functionality — Items To Implement
1. **Non-Conformance Reports** — Inspections, QC dispositions, non-conformance tracking
2. **Exception Management** — Rules engine, state machines for exception handling
3. **Advanced Cycle Counting** — Scheduled counts, blind counts, ad-hoc counts
4. **VAS Execution** — Value-added service workflows (kitting, labeling, etc.)
5. **Carrier Rate Shopping** — Multi-carrier rate comparison at shipping-time
6. **Inventory Lot Service** — Lot tracking, FIFO allocation, lot attributes
7. **ProductClientAssignment** — Client-specific product configs, client-brand mapping
8. **Loading Docks** — Dock scheduling, door assignments, staging
9. **Packing Stations** — Station management, pack workflows, box recommendations

## Tests
- **Unit tests** (`pnpm run test`): 19 tests, all passed
- **E2E tests** (`pnpm run test:e2e`): Requires `E2E_TEST_DB_URL` (dedicated test database schema) — not set in current env; pre-existing infra need

## Current Known Issues
- (none known — app starts cleanly, Swagger UI at `/api/docs`, 124+ OpenAPI paths, health endpoints respond 200, unit tests pass)

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
