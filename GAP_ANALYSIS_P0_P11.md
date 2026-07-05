# Gap Analysis: Phases 0–11 — Complete WMS Web & RF Coverage

**Generated:** 2026-07-04  
**Reference:** Manhattan WMS workflows, NEW_PROJECT_GUIDE.md, Phase plans 0–11  
**Assessment:** 8/14 modules implemented (partial), 31 controllers built, 26 services built, 142 Prisma models exist

---

## Cross-Cutting Gaps (All Phases)

| # | Gap | Impact | Phase Ref |
|---|-----|--------|-----------|
| CC-01 | **No DTOs anywhere** — all controllers use `@Body() dto: any` | No type safety, no runtime validation, no Swagger schema, no class-validator decorators | P0 |
| CC-02 | **No RfSessionGuard / RfActionLightweightGuard** — RF controllers use JwtAuthGuard+CaslGuard (web pattern) | RF devices get JWT auth instead of session-based; session lifecycle not enforced | P0/P13 |
| CC-03 | **Missing decorators**: `@AuditLog()`, `@QuotaCheck()`, `@HoldOverride()`, `@RfAction()` | Audit logging not automatic; quota not enforced; no supervisor PIN; RF action type not tagged | P0/P13/P14/P15 |
| CC-04 | **Missing AuditService** — no `system_audit_logs` writes from services | No audit trail for inventory adjustments, status changes, or any data mutation | P14 |
| CC-05 | **Missing RfSessionService** — no RF session CRUD or validation | Session lifecycle not managed; no device registration | P13 |
| CC-06 | **Missing QuotaGuard + QuotaCheck** — no resource quota enforcement | Tenants can exceed allocated storage/users/transactions | P15 |
| CC-07 | **No lifecycle/shutdown module** — ShutdownService not implemented | No graceful drain; RF devices timeout during deployment | P15 |
| CC-08 | **No test files anywhere** — zero `.spec.ts` files | No verification of business logic | P0 |
| CC-09 | **Observability stubs** — no OTel, no Prometheus metrics, no audit interceptor | No production monitoring | P14 |
| CC-10 | **No seed module** — WmsRoleSeederService, UomSeederService not implemented | New tenants have no permissions/UOMs provisioned | P15 |

---

## Phase 0 — Foundation Infrastructure

**Status: PARTIAL** — interceptors, guards, middleware, Redis, BullMQ, tenant isolation all implemented. Several decorators and lifecycle items missing.

### Gaps and Sub-Tasks

- **P0-GAP-01: Missing `@AuditLog()` decorator** — file `src/common/decorators/audit-log.decorator.ts`
  - SetMetadata-based decorator for `{ eventType, detail? }`
  - Sub: Create AuditInterceptor (global APP_INTERCEPTOR) that reads metadata and calls AuditService
- **P0-GAP-02: Missing `@RfAction()` decorator** — file `src/common/decorators/rf-action.decorator.ts`
  - SetMetadata-based: `'read' | 'create' | 'update' | 'delete'`
- **P0-GAP-03: Missing `@QuotaCheck()` decorator** — file `src/common/decorators/quota-check.decorator.ts`
  - SetMetadata for resource type name
- **P0-GAP-04: Missing `@HoldOverride()` decorator** — file `src/common/decorators/hold-override.decorator.ts`
  - SetMetadata for supervisor PIN override flag
- **P0-GAP-05: Missing RfSessionGuard** — file `src/common/guards/rf-session.guard.ts`
  - Reads `x-rf-session-id` header, validates session from DB, sets `req.rfSession`
- **P0-GAP-06: Missing RfActionLightweightGuard** — file `src/common/guards/rf-action-lightweight.guard.ts`
  - Reads `@RfAction()` metadata, validates action for RF session role
- **P0-GAP-07: Missing AuditService** — file `src/common/audit/audit.service.ts`
  - Writes to `system_audit_log` table with tenantId, userId, action, entity, entityId, oldValue, newValue
- **P0-GAP-08: Missing RfSessionService** — file `src/common/rf-session/rf-session.service.ts`
  - CRUD for `DbRfSession` table (active sessions, expiry, device info)
- **P0-GAP-09: Missing context/system context support** in PrismaService
  - `store?.isSystemContext` flag to bypass tenant isolation for system operations
- **P0-GAP-10: Missing ShutdownService** — file `src/lifecycle/shutdown.service.ts`
  - Drains active jobs, pauses queues, closes connections
  - ShutdownDrainMiddleware rejects non-RF with 503
- **P0-GAP-11: Missing QuotaGuard** — file `src/common/guards/quota.guard.ts`
  - Reads `@QuotaCheck()` metadata, checks `resource_quotas` table
- **P0-GAP-12: Missing RfSessionModule** — file `src/common/rf-session/rf-session.module.ts`
  - Global module exporting RfSessionService
- **P0-GAP-13: Missing AuditModule** — file `src/common/audit/audit.module.ts`
  - Global module exporting AuditService

---

## Phase 1 — Master Data

**Status: PARTIAL** — Clients, Vendors, Products, Carriers, Customers, UOM, Brands, Categories + Facilities, Zones, Locations, Structure built. Several sub-domains and RF endpoints missing.

### Gaps and Sub-Tasks

- **P1-GAP-01: Missing Product Attributes sub-module**
  - Service: `src/master-data/product-attributes/product-attribute.service.ts`
  - Web controller: `src/master-data/product-attributes/web/product-attribute.controller.ts`
  - Endpoints: POST/GET/PATCH `/web/product-attributes[/:id]`
- **P1-GAP-02: Missing Product Variants sub-module**
  - Service + controller: POST/GET/PATCH `/web/product-variants[/:id]`
- **P1-GAP-03: Missing Product Suppliers sub-module**
  - Service + controller: POST/GET/PATCH `/web/product-suppliers[/:id]`
- **P1-GAP-04: Missing Product Packaging Hierarchy sub-module**
  - Service + controller: POST/GET/PATCH `/web/product-packaging[/:id]`
- **P1-GAP-05: Missing Product Client Assignments sub-module**
  - Service + controller: POST/GET/PATCH `/web/product-client-assignments[/:id]`
- **P1-GAP-06: Missing Product Velocity Classification sub-module**
  - Service + controller: POST/GET/PATCH `/web/product-velocity[/:id]`
  - ABC analysis logic
- **P1-GAP-07: Missing Product Import Pipeline** (full implementation)
  - `src/master-data/product-import/product-import.service.ts` — real CSV/Excel parsing
  - `src/master-data/product-import/product-import.processor.ts` — BullMQ consumer
  - `src/master-data/product-import/dtos/` — typed DTOs
  - Endpoints: POST `/web/products/import`
- **P1-GAP-08: Missing Barcode Labels sub-module**
  - `src/master-data/barcode-labels/barcode-label.service.ts` — label generation + print queue
  - Web controller: POST `/web/barcode-labels/generate`, GET `/web/barcode-labels/:id/print`
  - Template system for label formats
- **P1-GAP-09: Missing Warehouse Security sub-module**
  - `src/warehouse/security/` — facility_access_control, facility_user_assignments
  - Service + web controller: POST/GET/PATCH `/web/facility-access[/:id]`
- **P1-GAP-10: Missing Loading Docks sub-module**
  - `src/warehouse/structure/` — loading_docks CRUD in StructureService
- **P1-GAP-11: Missing RF endpoint `/rf/facilities/current`**
- **P1-GAP-12: Missing web endpoint `/web/products/barcode/:code`** (product lookup by barcode)
- **P1-GAP-13: Missing Aisles/Bays/Racks/Rows/Levels web endpoints** — aisles, bays, rack_rows, rack_levels have no controllers
- **P1-GAP-14: Missing Rack model** — `warehouse_racks` table not in Prisma schema (planned new table)

---

## Phase 2 — Inbound

**Status: MOSTLY COMPLETE** — PO, ASN, Receiving, Putaway, Returns all built with services + web + RF controllers. Some stubs and missing endpoints remain.

### Gaps and Sub-Tasks

- **P2-GAP-01: ASN import pipeline stubs** — `AsnImportProcessor` (parse/validate/import methods) are empty stubs
  - Sub: Implement `parse()` — CSV/Excel/EDI parsing
  - Sub: Implement `validate()` — field validation, product matching, vendor matching
  - Sub: Implement `import()` — create ASN + ASN lines in database
- **P2-GAP-02: RF receiving/stage endpoint is a stub** — returns hardcoded response without DB update
  - Sub: Implement real staging location update on goods_receipts
- **P2-GAP-03: Missing ASN lines endpoint** — GET `/web/advance-ship-notices/:id/lines`
- **P2-GAP-04: Missing web endpoint for customer returns receive** — POST `/web/customer-returns/:id/receive`
- **P2-GAP-05: Missing RF `receive/scan-po` endpoint** — scans PO to load expected lines (controller exists but check service)
- **P2-GAP-06: Missing blind-receive without ASN/PO** — `/web/goods-receipts/blind` endpoint

---

## Phase 3 — Inventory

**Status: NOT STARTED** — Inventory tables exist in Prisma (22+ models) but no module, no services, no controllers of any kind.

### Gaps and Sub-Tasks

- **P3-GAP-01: Create Inventory Module** — `src/inventory/inventory.module.ts`
  - Register PrismaModule
  - Register all sub-modules
- **P3-GAP-02: On-Hand Service** — `src/inventory/on-hand/on-hand.service.ts`
  - `findAll` (filterable: location, product, lot, LPN), `findById`, `getQuantityAtLocation`
  - Web: GET `/web/inventory/on-hand`, GET `/web/inventory/on-hand/:id`
- **P3-GAP-03: LPN Service** — `src/inventory/lpn/lpn.service.ts`
  - CRUD, barcode lookup, transaction history
  - Web: POST/GET/PATCH `/web/lpns[/:id]`, POST `/web/lpns/barcode/:code`, GET `/web/lpns/:id/transactions`
  - RF: POST `/rf/lpn/lookup`, POST `/rf/lpn/move`
- **P3-GAP-04: Inventory Lots Service** — `src/inventory/lots/lot.service.ts`
  - CRUD, FIFO, expiry tracking
  - Web: POST/GET/PATCH `/web/inventory-lots[/:id]`
- **P3-GAP-05: Inventory Transactions Service** — `src/inventory/transactions/transaction.service.ts`
  - Filterable listing, detail by id
  - Web: GET `/web/inventory-transactions`
- **P3-GAP-06: Inventory Holds Service** — `src/inventory/holds/hold.service.ts`
  - CRUD, release with reason, hold override with supervisor PIN
  - Web: POST/GET/PATCH `/web/inventory-holds[/:id]`, POST `/web/inventory-holds/:id/release`
- **P3-GAP-07: Inventory Adjustments Service** — `src/inventory/adjustments/adjustment.service.ts`
  - CRUD, approval routing based on thresholds, variance investigation
  - Web: POST/GET `/web/inventory-adjustments[/:id]`, POST `/web/inventory-adjustments/:id/approve`
- **P3-GAP-08: Cycle Counts Service** — `src/inventory/counts/cycle-count.service.ts`
  - CRUD, line submission, completion, auto-variance detection, accuracy metrics
  - Web: POST/GET/PATCH `/web/cycle-counts[/:id]`, POST `/web/cycle-counts/:id/submit-line`, POST `/web/cycle-counts/:id/complete`
  - RF: POST `/rf/cycle-counts/start`, `/scan-location`, `/enter-qty`, `/submit-line`, `/complete`
- **P3-GAP-09: Allocations Service** — `src/inventory/allocations/allocation.service.ts`
  - CRUD, rule-based allocation, FIFO lot allocation
  - Web: POST/GET `/web/inventory-allocations`, POST/GET/PATCH `/web/allocation-rules[/:id]`
- **P3-GAP-10: Inventory Approvals Service** — `src/inventory/approvals/adjustment-approval.service.ts`
  - Approval routing (auto/supervisor/manager/director), approve/reject
  - Web: GET `/web/approvals/pending`, POST `/web/approvals/:id/approve`, POST `/web/approvals/:id/reject`
- **P3-GAP-11: Approval Thresholds Service** — `src/inventory/approvals/approval-threshold.service.ts`
  - CRUD for threshold configs
  - Web: POST/GET/PATCH `/web/approval-thresholds[/:id]`
- **P3-GAP-12: Auto-Approval Processor** — `src/inventory/approvals/auto-approval.processor.ts`
  - BullMQ queue `auto-approval-processor`
  - Batch auto-approves pending adjustments below autoThreshold
  - Cron schedule every 1 minute
- **P3-GAP-13: Missing 2 new Prisma tables** — `approval_threshold_configs`, `count_scheduler_metrics`
- **P3-GAP-14: Add all inventory CASL subjects** — `'InventoryOnHand' | 'LPN' | 'InventoryLot' | 'InventoryTransaction' | 'InventoryHold' | 'InventoryAdjustment' | 'CycleCount' | 'InventoryAllocation' | 'AdjustmentApproval' | 'ApprovalThresholdConfig'`

---

## Phase 4 — Outbound (Remaining Gaps)

**Status: MOSTLY COMPLETE** — Sales Orders, Allocation, Picking Waves/Tasks, Packing, Shipments, Loads all built. Several sub-domains missing.

### Gaps and Sub-Tasks

- **P4-GAP-01: Missing VAS Catalog sub-module** — `src/outbound/vas-catalog/`
  - VasServiceCatalog: POST/GET/PATCH `/web/vas/services[/:id]`
  - Client rates: POST/GET/PATCH `/web/vas/client-rates[/:id]`
  - Workstations: POST/GET/PATCH `/web/vas/workstations[/:id]`
  - RF: POST `/rf/vas/workstations`, POST `/rf/vas/workstations/:id/check-in`, POST `/rf/vas/workstations/:id/check-out`
- **P4-GAP-02: Missing VAS Execution sub-module** — `src/outbound/vas-execution/`
  - Tasks: POST/GET/PATCH `/web/vas/tasks[/:id]`, POST `/web/vas/tasks/:id/start`, POST `/web/vas/tasks/:id/complete`
  - Charges: GET `/web/vas/charges`
  - VAS billing logic (rate lookup by client)
- **P4-GAP-03: Missing Replenishment sub-module** — `src/outbound/replenishment/`
  - Rules: POST/GET/PATCH `/web/replenishment-rules[/:id]`
  - Tasks: GET/PATCH `/web/replenishment-tasks[/:id]`
- **P4-GAP-04: Missing Cross-Dock Operations sub-module** — `src/outbound/cross-dock/`
  - POST/GET/PATCH `/web/cross-dock-operations[/:id]`
- **P4-GAP-05: Missing Carrier Rates sub-module** — `src/outbound/carrier-rates/`
  - CarrierRate table + rate shopping engine
  - POST/GET/PATCH `/web/carrier-rates[/:id]`, POST `/web/carrier-rates/shop`
  - BullMQ queue: `carrier-rate-sync`
  - Missing `carrier_rates` table in Prisma (planned new table)
- **P4-GAP-06: Missing RF ship endpoints** — POST `/rf/outbound/ship/load`, POST `/rf/outbound/ship/dispatch`
- **P4-GAP-07: Missing Packing Materials sub-module** — box suggestion logic at pack time
- **P4-GAP-08: Missing Shipping Labels endpoint** — GET `/web/shipping-labels/:id/print`

---

## Phase 5 — Quality

**Status: NOT STARTED** — Quality tables exist in Prisma but no module, services, or controllers.

### Gaps and Sub-Tasks

- **P5-GAP-01: Create Quality Module** — `src/quality/quality.module.ts`
- **P5-GAP-02: Quality Inspections Service** — `src/quality/inspections/inspection.service.ts`
  - CRUD, result recording (PASS/FAIL/CONDITIONAL), timeline
  - Web: POST/GET/PATCH `/web/quality/inspections[/:id]`, POST `/web/quality/inspections/:id/record-result`, GET `/web/quality/inspections/:id/timeline`
  - RF: POST `/rf/quality/inspections/my-tasks`, POST `/rf/quality/inspections/:id/record-result`
- **P5-GAP-03: Quality Holds Service** — `src/quality/holds/quality-hold.service.ts`
  - CRUD, release with reason
  - Web: POST/GET/PATCH `/web/quality-holds[/:id]`, POST `/web/quality-holds/:id/release`
- **P5-GAP-04: Non-Conformance Reports Service** — `src/quality/ncr/ncr.service.ts`
  - CRUD with status workflow
  - Web: POST/GET/PATCH `/web/non-conformance-reports[/:id]`
- **P5-GAP-05: Compliance Service** — `src/quality/compliance/compliance.service.ts`
  - Compliance requirements: POST/GET/PATCH `/web/compliance-requirements[/:id]`
  - Audits: POST/GET/PATCH `/web/compliance-audits[/:id]`
  - Hazmat: POST/GET/PATCH `/web/hazmat-materials[/:id]`
- **P5-GAP-06: Receiving Inspection + QC Disposition** — `src/quality/receiving-inspection/`
  - Inspections: POST `/web/receiving-inspections`
  - QC Dispositions: POST `/web/qc-dispositions`
  - New Prisma tables: `inspections`, `qc_dispositions`
- **P5-GAP-07: Add CASL subjects** — `'QualityInspection' | 'ComplianceRequirement' | 'ComplianceAudit' | 'HazmatMaterial'`

---

## Phase 6 — VAS

**Status: See Phase 4 Gaps (VAS catalog + execution moved under outbound per plan)**

Gaps covered in P4-GAP-01 and P4-GAP-02 above.

---

## Phase 7 — Labor & Equipment

**Status: NOT STARTED** — Labor and Equipment tables exist in Prisma but no modules.

### Gaps and Sub-Tasks

- **P7-GAP-01: Create Labor Module** — `src/labor/labor.module.ts`
- **P7-GAP-02: Shifts Service** — `src/labor/shifts/shift.service.ts`
  - CRUD, assignments with conflict detection
  - Web: POST/GET/PATCH `/web/labor/shifts[/:id]`, POST/GET/PATCH `/web/labor/assignments[/:id]`
- **P7-GAP-03: Time Tracking Service** — `src/labor/time-tracking/time-tracking.service.ts`
  - Clock in/out, time log queries
  - Web: GET `/web/labor/time-logs`
  - RF: POST `/rf/labor/clock-in`, POST `/rf/labor/clock-out`
- **P7-GAP-04: Performance Service** — `src/labor/performance/performance.service.ts`
  - Metrics calculation, query
  - Web: GET `/web/labor/performance`
  - RF: POST `/rf/labor/my-metrics`
- **P7-GAP-05: Create Equipment Module** — `src/equipment/equipment.module.ts`
- **P7-GAP-06: Equipment Service** — `src/equipment/equipment.service.ts`
  - CRUD, status transitions
  - Web: POST/GET/PATCH `/web/equipment[/:id]`, PATCH `/web/equipment/:id/status`
  - RF: POST `/rf/equipment/available`, POST `/rf/equipment/:id/check-out`, POST `/rf/equipment/:id/check-in`
- **P7-GAP-07: Maintenance Service** — `src/equipment/maintenance/maintenance.service.ts`
  - CRUD, scheduling, completion
  - Web: POST/GET/PATCH `/web/equipment/maintenance[/:id]`, POST `/web/equipment/maintenance/:id/complete`
- **P7-GAP-08: Add CASL subjects** — Labor + Equipment subjects

---

## Phase 8 — Work Orders & Exceptions

**Status: NOT STARTED** — Tables exist in Prisma but no modules.

### Gaps and Sub-Tasks

- **P8-GAP-01: Create Work Orders Module** — `src/work-orders/work-orders.module.ts`
- **P8-GAP-02: Work Orders Service** — `src/work-orders/work-orders.service.ts`
  - CRUD, release, complete, cancel
  - Operations: start/complete operations
  - Components: reserve on release
  - Web: POST/GET/PATCH `/web/work-orders[/:id]`, POST `/web/work-orders/:id/release`, POST `/web/work-orders/:id/complete`, POST `/web/work-orders/:id/cancel`
  - Operations: POST/GET `/web/work-orders/:id/operations`
  - Components: POST/GET `/web/work-orders/:id/components`
  - RF: POST `/rf/work-orders/my-tasks`, POST `/rf/work-orders/:id/start-operation`, POST `/rf/work-orders/:id/complete-operation`
- **P8-GAP-03: Create Exceptions Module** — `src/exceptions/exceptions.module.ts`
- **P8-GAP-04: Exception Management Service** — `src/exceptions/exception-management.service.ts`
  - CRUD, acknowledge, resolve, severity hierarchy, auto-numbering (EXC-{FACILITY}-{SEQ})
  - Web: POST/GET/PATCH `/web/exceptions[/:id]`, POST `/web/exceptions/:id/acknowledge`, POST `/web/exceptions/:id/resolve`
  - RF: POST `/rf/exceptions/report`
- **P8-GAP-05: Exception Comments Service** — `src/exceptions/exception-comment.service.ts`
  - POST/GET `/web/exceptions/:id/comments`
- **P8-GAP-06: Exception Escalation Service** — `src/exceptions/exception-escalation.service.ts`
  - Rules CRUD: POST/GET/PATCH `/web/escalation-rules[/:id]`
  - Cron: every 5 minutes, evaluate escalation rules
- **P8-GAP-07: Add CASL subjects** — WorkOrder, Exception subjects

---

## Phase 9 — Integrations & Transfers

**Status: NOT STARTED** — No modules exist. 5 new tables need to be created.

### Gaps and Sub-Tasks

- **P9-GAP-01: Create Transfers Module** — `src/transfers/transfers.module.ts`
- **P9-GAP-02: Inventory Transfers Service** — `src/transfers/transfers.service.ts`
  - CRUD, dispatch (decrement source), receive (increment dest), status lifecycle
  - Web: POST/GET `/web/transfers[/:id]`, POST `/web/transfers/:id/dispatch`, POST `/web/transfers/:id/receive`, GET `/web/transfers/:id/lines`
  - RF: POST `/rf/transfers/initiate`, POST `/rf/transfers/scan-lpn`, POST `/rf/transfers/complete`
- **P9-GAP-03: Create Integrations Module** — `src/integrations/integrations.module.ts`
- **P9-GAP-04: Webhook Handler Service** — `src/integrations/webhooks/webhook.service.ts`
  - Incoming webhook with dedup (payloadHash UNIQUE)
  - POST `/web/integration/webhooks/:platform/:event`
  - Webhook dedup guard
  - GET `/web/integration/webhook-logs`
- **P9-GAP-05: Entity Mapping Service** — `src/integrations/entity-mapping/entity-mapping.service.ts`
  - CRUD for external↔WMS entity mappings
  - Web: POST/GET `/web/integration/entity-mappings[/:id]`
- **P9-GAP-06: Integration Sync Logs** — `src/integrations/sync-logs/`
  - GET `/web/integration/sync-logs`
- **P9-GAP-07: Platform Adapters** — `src/integrations/adapters/`
  - ShopifyAdapter, WooCommerceAdapter (stubs initially)
- **P9-GAP-08: Create 5 new Prisma tables** — `inventory_transfers`, `inventory_transfer_lines`, `integration_sync_logs`, `sync_webhook_logs`, `external_entity_mappings`
- **P9-GAP-09: Add CASL subjects** — Transfer + Integration subjects

---

## Phase 10 — Workflow Engine

**Status: NOT STARTED** — Triple engine (XState + Zen DMN + BPMN 2.0) not built. 4 new tables needed.

### Gaps and Sub-Tasks

- **P10-GAP-01: Create Workflow Module** — `src/workflow/workflow.module.ts`
- **P10-GAP-02: State Machine Service** — `src/workflow/state-machine/state-machine.service.ts`
  - XState v5 integration, definition CRUD, execution, persistence
  - Web: POST/GET/PATCH `/web/workflow/state-machines[/:id]`, POST `/web/workflow/state-machines/:id/execute`
- **P10-GAP-03: Rule Engine Service** — `src/workflow/rule-engine/rule-engine.service.ts`
  - Zen DMN + JDM fallback, DMN decision table evaluation, 20+ operators, context resolvers
  - Web: POST/GET/PATCH `/web/workflow/rules[/:id]`, POST `/web/workflow/rules/:id/evaluate`
- **P10-GAP-04: BPMN Service** — `src/workflow/bpmn/bpmn.service.ts`
  - BPMN 2.0 process execution, service task dispatch, no scriptTask
  - Web: POST/GET/PATCH `/web/workflow/bpmn-processes[/:id]`, POST `/web/workflow/bpmn-processes/:id/start`
- **P10-GAP-05: Workflow Orchestrator** — `src/workflow/orchestrator/workflow-orchestrator.service.ts`
  - BPMN → evaluateRule → transitionStateMachine orchestration flow
  - Depth limits: SM=20, BPMN=50
  - Function injection detection
- **P10-GAP-06: Execution Instances** — `src/workflow/orchestrator/` web endpoints
  - GET `/web/workflow/instances`, GET `/web/workflow/instances/:id`
- **P10-GAP-07: Context Resolvers** — `src/workflow/rule-engine/context-resolvers/`
  - inventory.resolver.ts, carrier-rate.resolver.ts, product-attribute.resolver.ts
- **P10-GAP-08: Redis Caching** — Cache state machine defs (ttl 300s), rule defs (ttl 300s), rule input hash (ttl 60s)
- **P10-GAP-09: BullMQ Recovery Queue** — `workflow-recovery` queue for long-running instances (>24h auto-suspend)
- **P10-GAP-10: Create 4 new Prisma tables** — `wms_state_machines`, `wms_execution_instances`, `wms_rules`, `wms_bpmn_processes`
- **P10-GAP-11: Add CASL subjects** — WorkflowInstance, StateMachine, Rule, BpmnProcess

---

## Phase 11 — Fulfillment Workflow

**Status: NOT STARTED** — Fulfillment tables exist in Prisma (7 models) but no module.

### Gaps and Sub-Tasks

- **P11-GAP-01: Create Fulfillment Module** — `src/fulfillment/fulfillment.module.ts`
- **P11-GAP-02: Fulfillment Workflow Service** — `src/fulfillment/fulfillment-workflow.service.ts`
  - Records events + transitions during fulfillment lifecycle (pick→pack→ship progress)
  - Web: POST/GET/PATCH `/web/fulfillment/workflow-definitions[/:id]`
  - Web: GET `/web/fulfillment/executions`
  - Web: GET `/web/workflows/instances/:id/events`
  - Web: GET `/web/workflows/instances/:id/transitions`
- **P11-GAP-03: Fulfillment Billing Service** — `src/fulfillment/fulfillment-billing.service.ts`
  - Billing runs with auto-numbering
  - Web: POST/GET `/web/fulfillment-billing/runs[/:id]`
- **P11-GAP-04: Add CASL subjects** — 'FulfillmentWorkflowEvent', 'FulfillmentWorkflowTransition', 'FulfillmentBillingRun', 'FulfillmentBillingEvent'

---

## Summary: Implementation Effort Estimate

| Priority | Phase | Items | Est. Files | Est. Effort |
|----------|-------|-------|-----------|-------------|
| CRITICAL | CC | DTOs for all 31 existing controllers | ~60 DTOs | Large |
| CRITICAL | CC | RfSessionGuard + RfActionGuard + RfSessionService | 5 files | Medium |
| CRITICAL | CC | Missing decorators (AuditLog, RfAction, QuotaCheck, HoldOverride) | 4 files | Small |
| HIGH | P3 | Inventory Module (10 sub-domains) | 40+ files | Very Large |
| HIGH | P5 | Quality Module | 20+ files | Large |
| HIGH | P4 | Outbound sub-domains (VAS, Replenishment, Cross-Dock, Carrier) | 20+ files | Large |
| HIGH | P7 | Labor + Equipment Modules | 20+ files | Large |
| HIGH | P8 | Work Orders + Exceptions Modules | 15+ files | Large |
| MEDIUM | P9 | Transfers + Integrations Modules | 15+ files | Large |
| MEDIUM | P1 | Master Data sub-domains (Attributes, Variants, etc.) | 15+ files | Medium |
| MEDIUM | P10 | Workflow Engine | 20+ files | Very Large |
| MEDIUM | P11 | Fulfillment Module | 8+ files | Medium |
| LOW | P2 | Inbound fixes (ASN stubs, receiving/stage stub) | 3 files | Small |
| LOW | P0 | Lifecycle, Quota, Observability, Seeding, Core-Client | 15+ files | Large |

**TOTAL GAPS IDENTIFIED: 80+ items across 12 phases**
