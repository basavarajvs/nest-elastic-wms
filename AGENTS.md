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
├── billing/            (web/, dtos/)
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
├── outbound/          (loads/, shipping-labels/, vas-catalog/, vas-execution/, web/, rf/, dtos/)
├── prisma/
├── quality/           (non-conformance-reports/, quality-inspections/, compliance/)
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
- (none known — app starts cleanly, Swagger UI at `/api/docs`, 130+ OpenAPI paths, health endpoints respond 200, unit tests pass (16 new quality tests))

## Phase 5 — Quality (2026-06-24)
- **New models**: `quality_inspections`, `quality_inspection_results`, `quality_inspection_events`, `compliance_requirements`, `compliance_audits`, `hazmat_materials`
- **New modules**: `src/quality/quality-inspections/`, `src/quality/compliance/`
- **Web endpoints**: Quality inspections CRUD + results + events timeline; compliance requirements + audits; hazmat material registration
- **RF endpoints**: `POST /rf/quality/inspections/my-tasks`, `POST /rf/quality/inspections/:id/record-result`
- **Migration**: `0023_add_quality_compliance_hazmat` (applied to DB)
- **CASL**: Added `QualityInspection`, `ComplianceRequirement`, `ComplianceAudit`, `HazmatMaterial` subjects; granted `Manage` to `WAREHOUSE_ADMIN`
- **Tests**: 16 unit tests (quality-inspections: 9, compliance: 7), all passing

## Phase 6 — VAS Catalog & Client Rates (2026-06-24)
- **New models**: `vas_services`, `vas_service_client_rates`, `vas_workstations`; added `service_id`, `client_id` to `vas_execution_tasks`
- **New module**: `src/outbound/vas-catalog/`
- **Web endpoints**: Services CRUD, client rate management, workstation CRUD
- **RF endpoints**: `GET /rf/vas/workstations`, `POST /rf/vas/workstations/:id/check-in`, `POST /rf/vas/workstations/:id/check-out`
- **VasExecutionService wiring**: Service validation against catalog on task creation; rate auto-lookup from `VasServiceClientRate` with fallback to `VasService.defaultRate`; populates `ratePerUnit` and `totalCharge`
- **Migration**: `0024_add_vas_catalog_workstations` (applied to DB)
- **CASL**: Added `VasServiceCatalog`, `VasWorkstation` subjects; granted `Manage` to `WAREHOUSE_ADMIN`
- **Tests**: 22 unit tests (vas-catalog: 12, vas-execution: 10), all passing

## Phase 7 — Storage Billing Engine (2026-06-24)
- **New models**: `storage_rate_master`, `storage_client_rates`, `billing_cycles`, `storage_inventory_snapshots`, `storage_charges`, `client_invoices`, `client_invoice_lines`
- **New module**: `src/billing/`
- **Services**: `StorageRateService` (rate master + client rates CRUD), `BillingCycleService` (cycle config), `SnapshotService` (daily snapshots from `InventoryOnHand` + charge calculation), `InvoiceService` (invoice generation from charges + lifecycle)
- **Web endpoints**: 13 endpoints covering rates, cycles, snapshots, charges, invoices
- **Migration**: `0025_add_storage_billing_models` (applied to DB with 7 tables, FK constraints, indices)
- **CASL**: Added `StorageRateMaster`, `StorageClientRate`, `BillingCycle`, `StorageInventorySnapshot`, `StorageCharge`, `ClientInvoice` subjects; granted `Manage` to `WAREHOUSE_ADMIN`
- **Tests**: 23 unit tests (storage-rate: 7, billing-cycle: 2, snapshot: 8, invoice: 6), all passing

## Phase 8 — Dock & Yard Management (2026-06-24)
- **New models**: `dock_appointments`, `yard_vehicles` (2 tables with unique indexes + FKs)
- **New module**: `src/outbound/dock-yard/`
- **Services**: `DockYardService` (appointment CRUD + lifecycle, vehicle registration + dock assignment)
- **Web endpoints**: `POST/GET /web/dock-appointments`, `PATCH .../check-in`, `PATCH .../complete`, `PATCH .../cancel`; `POST/GET /web/yard/vehicles`, `PATCH .../assign-dock`, `PATCH .../depart`
- **RF endpoint**: `GET /rf/dock-appointments/upcoming`
- **Migration**: `0026_add_dock_appointments_yard_vehicles` (applied to DB)
- **CASL**: Added `DockAppointment`, `YardVehicle` subjects; granted `Manage` to `WAREHOUSE_ADMIN`
- **Tests**: 13 unit tests (dock-yard service), all passing

## Phase 9 — Labor Management (2026-06-24)
- **New models**: `labor_shifts`, `labor_shift_assignments`, `labor_time_logs`, `labor_performance_metrics` (4 tables)
- **New module**: `src/labor/` (shift.service, time-tracking.service, performance.service, web + rf controllers, dtos)
- **Web endpoints**: 8 labor routes (shifts CRUD, assignments CRUD, clock in/out, time logs, performance)
- **RF endpoints**: 3 routes (clock-in, clock-out, my-metrics)
- **Migration**: `0027_add_labor_management` (applied to DB)
- **CASL**: `LaborShift`, `LaborShiftAssignment`, `LaborTimeLog`, `LaborPerformanceMetric` subjects; `Manage` to `WAREHOUSE_ADMIN`
- **Tests**: 15 unit tests (shift: 7, time-tracking: 5, performance: 3), all passing

## Phase 10 — Equipment Management (2026-06-25)
- **New models**: `warehouse_equipment`, `equipment_maintenance` (2 tables with FK, unique indexes + indices)
- **New module**: `src/equipment/` (equipment.service, maintenance.service, web + rf controllers, dtos)
- **Web endpoints**: 7 routes (equipment CRUD, status change, maintenance CRUD + complete)
- **RF endpoints**: 3 routes (list available, check-out, check-in)
- **Migration**: `0028_add_equipment_management` (applied to DB)
- **CASL**: `WarehouseEquipment`, `EquipmentMaintenance` subjects; `Manage` to `WAREHOUSE_ADMIN`
- **Duplicate route fix**: Removed old `QualityWebController` from `InboundModule` (conflicted with `QualityInspectionsWebController` POST `/web/quality/inspections`)
- **App startup**: Confirmed — all routes register, health endpoint returns 200

## Phase 11 — Exception Comments & Escalation (2026-06-25)
- **New models**: `exception_comments`, `exception_escalation_rules` (2 tables with FK + cascades)
- **Migration**: `0029_add_exception_comments_escalation` (applied to DB)
- **CASL**: `ExceptionComment`, `ExceptionEscalationRule` subjects; `Manage` to `WAREHOUSE_ADMIN`

## Phase 12 — Work Orders (2026-06-25)
- **New models**: `work_orders`, `work_order_operations`, `work_order_components` (3 tables with FKs + unique indexes)
- **New module**: `src/work-orders/` (work-orders.service, operations.service, components.service, web + rf controllers, dtos)
- **Web endpoints**: 10 routes (CRUD, release, complete, cancel, add/update operations, add components)
- **RF endpoints**: 3 routes (my-tasks, start-operation, complete-operation)
- **Migration**: `0030_add_work_orders` (applied to DB via `prisma migrate deploy`)
- **CASL**: `WorkOrder`, `WorkOrderOperation`, `WorkOrderComponent` subjects; `Manage` to `WAREHOUSE_ADMIN`
- **Tests**: 27 unit tests, all passing

## Phase 13 — Event & Audit Infrastructure (2026-06-25)
- **New models**: `warehouse_events`, `system_audit_logs` (2 tables with indexes + FKs)
- **New sub-module**: `src/observability/audit/` (audit.service, warehouse-event.service, web controller, dtos)
- **Services**: `AuditService` (write + query audit logs), `WarehouseEventService` (publish + query events)
- **@AuditLog() decorator**: `src/common/decorators/audit-log.decorator.ts` — SetMetadata-based decorator for controller methods
- **AuditInterceptor**: `src/common/interceptors/audit.interceptor.ts` — global APP_INTERCEPTOR that auto-records audit logs for decorated endpoints
- **Web endpoints**: `GET /web/audit-logs` (filterable), `GET /web/events` (filterable), `GET /web/events/:id`
- **Migration**: `0031_add_event_audit_infrastructure` (applied to DB via manual SQL + `prisma migrate resolve`)
- **CASL**: `WarehouseEvent`, `SystemAuditLog` subjects; `Manage` to `WAREHOUSE_ADMIN`
- **Tests**: 11 unit tests, all passing
- **ObservabilityModule**: Updated to import/export AuditModule (global scope)
- **PrismaService**: Added `WarehouseEvent`, `SystemAuditLog` to `hasTenantId` for automatic tenant isolation

## Phase 14 — Daily KPI & Analytics (2026-06-25)
- **New models**: `daily_kpi_metrics`, `location_pick_heatmaps` (2 tables with unique + indexed columns)
- **New module**: `src/analytics/` (kpi.service, heatmap.service, web controller, dtos)
- **Services**: `KpiService` (daily KPI query + aggregate summary), `HeatmapService` (pick heatmap + top locations)
- **Web endpoints**: `GET /web/analytics/kpi/daily` (filterable), `GET /web/analytics/kpi/summary` (totals + averages), `GET /web/analytics/heatmap/pick` (filterable by date/zone), `GET /web/analytics/heatmap/locations/top` (top N)
- **Migration**: `0032_add_daily_kpi_analytics` (applied to DB via manual SQL + `prisma migrate resolve`)
- **CASL**: `DailyKpiMetric`, `LocationPickHeatmap` subjects; `Manage` to `WAREHOUSE_ADMIN`
- **Tests**: 12 unit tests (kpi: 6, heatmap: 6), all passing
- **PrismaService**: Added `DailyKpiMetric`, `LocationPickHeatmap` to `hasTenantId` for automatic tenant isolation
- **AppModule**: `AnalyticsModule` registered

## Phase 15 — Fulfillment Workflow Events & Billing (2026-06-25)
- **New models**: `fulfillment_workflow_events`, `fulfillment_workflow_transitions`, `fulfillment_billing_runs`, `fulfillment_billing_events` (4 tables with FKs + indexes)
- **New services**: `FulfillmentWorkflowService` (event/transition recording + query), `FulfillmentBillingService` (run CRUD + lifecycle + auto-numbering)
- **Web endpoints**: `GET /web/workflows/instances/:id/events`, `GET /web/workflows/instances/:id/transitions`, `POST /web/fulfillment-billing/runs`, `GET /web/fulfillment-billing/runs`, `GET /web/fulfillment-billing/runs/:id`
- **Migration**: `0033_add_fulfillment_workflow_billing` (applied to DB via manual SQL + `prisma migrate resolve`)
- **CASL**: `FulfillmentWorkflowEvent`, `FulfillmentWorkflowTransition`, `FulfillmentBillingRun`, `FulfillmentBillingEvent` subjects; `Manage` to `WAREHOUSE_ADMIN`
- **Tests**: 13 unit tests (fulfillment: 7, billing: 6), all passing
- **CustomizationModule**: Extended with new providers/controllers/exports
- **PrismaService**: Added all 4 models to `hasTenantId` for automatic tenant isolation

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
