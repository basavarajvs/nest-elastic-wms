# WMS Platform — Complete Overview for Frontend Development

> **Source-verified document.** Every capability listed below has been confirmed against the actual source code (`src/`). Gaps and stubs are explicitly marked as **[PENDING]** or **[STUB]**.

---

## 1. Project Overview

This is a **multi-tenant Warehouse Management System (WMS)** built as a domain-specific NestJS microservice that sits alongside a "SaaS Core" platform. It handles the full lifecycle of warehouse operations:

- **Inbound**: ASN management, goods receipt (GRN), QC inspection, putaway
- **Inventory**: On-hand tracking (FEFO), transactions (immutable audit trail), holds, adjustments (with approval workflow), policies (reorder/safety stock)
- **Outbound**: Sales orders, FEFO-based allocation (soft→hard), wave planning, zone-sorted picking, packing, shipping
- **Transfers**: Intra/inter-facility, customer/vendor return, discrepancy reconciliation
- **Cycle Counting**: Blind/known/spot methods, ABC-driven scheduling, variance→approval pipeline
- **Customization Engine**: XState state machines, ZenEngine decision rules, BPMN 2.0 processes — all versioned and tenant-isolated
- **Integrations**: Shopify, WooCommerce adapters with circuit breakers, batched sync, webhook dedup

The system exposes two distinct API surfaces — **Web** (desk-bound planners/admins) and **RF** (warehouse floor operators with handheld scanners).

---

## 2. Tech Stack

| Layer | Technology | Status |
|---|---|---|
| **Runtime** | Node.js 24+, TypeScript 5.7 | ✅ |
| **Framework** | NestJS 11 (Fastify v5 adapter) | ✅ |
| **Database** | PostgreSQL 16 via Prisma 5, schema `multitenant` | ✅ |
| **Queue / Async** | BullMQ (Redis-backed) — allocation, putaway generation, wave planning, labels, inventory sync, reports | ✅ |
| **Cache / Sessions** | Redis (ioredis) — RF sessions, rate limiting, product/location lookups, report caching | ✅ |
| **Auth (Web)** | JWT Bearer from SaaS Core (`@nestjs/jwt` + Passport) | ✅ |
| **Auth (RF)** | JWT + stateful RF session ID (`x-rf-session-id` header, Redis + DB persistence, 15 min TTL) | ✅ |
| **Auth (Scanner)** | Device ID + Scanner Token (Redis-backed) | ✅ |
| **Authorization** | **Web**: CASL (ability-based) via `@CheckAbility()` decorator | ✅ |
| | **RF**: Lightweight role-action map via `@RfAction()` decorator | ✅ |
| **API Docs** | Swagger UI at `/api/docs` (when `SWAGGER_ENABLED=true`) — 137 OpenAPI paths | ✅ |
| **Workflow Engines** | XState (state machine execution), ZenEngine (decision tables + graph), bpmn-moddle (BPMN parse/validate) | ✅ |
| **BPMN Runtime** | `bpmn-engine` in `package.json` but **NOT integrated** into any service | ⚠️ |
| **Observability** | OpenTelemetry (OTLP), Prometheus metrics, Pino structured logging | ✅ |
| **Reports** | Streaming Excel (exceljs) and CSV (csv-stringify), S3 upload, cached results | ✅ |
| **Testing** | Jest, Supertest (E2E) | ✅ |
| **Deployment** | Docker, K8s, rolling deployment with health probes | ✅ |

---

## 3. Database (PostgreSQL via Prisma)

**All 41 models** live in the `multitenant` schema. Every table has a `tenantId` column and uses `@@map()` for snake_case naming.

### Warehouse Structure (3 models)
| Model | Key Fields | Purpose |
|---|---|---|
| `WarehouseFacility` | `facilityCode`, `facilityName`, `facilityType` (WAREHOUSE/DC/CROSS_DOCK/FULFILLMENT_CENTER) | Top-level facility |
| `WarehouseZone` | `zoneCode`, `zoneName`, `zoneType` (BULK/PICKING/RECEIVING/SHIPPING/PACKING/STAGING/QC/HOLD/YARD) | Zone within a facility |
| `StorageLocation` | `locationCode`, `locationType` (PALLET/CASE/EACH/FLOOR/STAGING/DOCK/TEMP), `parentLocationId` (self-ref) | Individual bin/slot with hierarchy |

### Product Catalog (7 models)
| Model | Purpose |
|---|---|
| `ProductCategory` | Self-referencing category tree |
| `UnitOfMeasure` | Base UOM definitions (EA, KG, PAL, etc.) — auto-seeded per tenant |
| `Product` | Master product with `trackLot`, `trackSerial`, `trackExpiry`, `velocityClass` |
| `ProductBarcode` | Multiple barcodes per product (CODE128, EAN13, UPC_A, GS1_128, QR, INTERNAL) |
| `ProductAttribute` | Key-value attributes |
| `ProductImportJob` / `ProductImportResult` | Bulk import tracking |

### Inventory (6 models)
| Model | Purpose |
|---|---|
| `InventoryLot` | Lot-level with `lotNumber`, `supplierLot`, `mfgDate`, `expiryDate`, `receivedDate` (FEFO indexed) |
| `InventoryOnHand` | Core stock: `quantityOnHand`, `quantityAllocated`, `quantityReserved`, `quantityPicked`, `quantityOnHold`, `damagedQuantity` — unique per product+location+lot |
| `InventoryTransaction` | Immutable audit trail with 17 transaction types |
| `InventoryHold` | 7 hold types: QC_PENDING, QC_FAILED, DAMAGE, CYCLE_COUNT, CREDIT_HOLD, CUSTOMER_REQUEST, QUARANTINE |
| `InventoryAdjustment` / `InventoryAdjustmentLine` | DRAFT→PENDING_APPROVAL→APPROVED workflow |
| `InventoryPolicy` | `reorderPoint`, `maxStockLevel`, `safetyStock` per product+location |

### Inbound (7 models)
| Model | Purpose |
|---|---|
| `AdvanceShipNotice` (ASN) | Status lifecycle: CREATED→IN_TRANSIT→ARRIVED→IN_RECEIVING→PARTIALLY_RECEIVED→RECEIVED→CLOSED |
| `AsnLine` | Expected qty, received qty, lot tracking |
| `GoodsReceipt` (GRN) | From ASN or ad-hoc; status: CREATED→ARRIVED→RECEIVING→PARTIAL→RECEIVED→INSPECTION_IN_PROGRESS→INSPECTED→COMPLETED |
| `GoodsReceiptLine` | QC tracking, disposition, linked LPNs |
| `Inspection` | QC record |
| `QcDisposition` | 6 actions: ACCEPT, REJECT, QUARANTINE, RETURN_TO_VENDOR, REWORK, DESTROY |
| `LPN` (License Plate Number) | Nestable hierarchy: PALLET→CARTON→CASE→MIXED→EACH, max depth 3 |
| `PutawayTask` | Priority-sorted, suggested location from inventory policy |

### Outbound (8 models)
| Model | Purpose |
|---|---|
| `SalesOrder` | Status: CREATED→VALIDATED→ON_HOLD→RELEASED→ALLOCATED→WAVED→PICKED→PACKED→SHIPPED→CLOSED→CANCELLED |
| `SalesOrderLine` | Requested/fulfilled quantities, 10+ line-level statuses |
| `InventoryAllocation` | SOFT→HARD_ALLOCATED→FULFILLED→CANCELLED, 24 hr expiry |
| `PickingWave` | Groups orders, stores selection criteria, tracks total/completed tasks |
| `PickingTask` | Zone-sorted by sequence, short-pick and backorder support |
| `PackingSession` / `PackingContainer` | Station-based packing, container tracking with picked LPNs |
| `OutboundShipment` | Carrier, tracking, load/dock door, container references |

### Transfers (2 models)
| Model | Purpose |
|---|---|
| `InventoryTransfer` | Types: INTRA_FACILITY, INTER_FACILITY, CUSTOMER_RETURN, VENDOR_RETURN |
| `InventoryTransferLine` | Shipped/received quantities, discrepancy tracking |

### Counts (3 models)
| Model | Purpose |
|---|---|
| `CycleCount` | Methods: BLIND/KNOWN/SPOT/CONTROL_GROUP; frequencies: MANUAL/DAILY/WEEKLY/MONTHLY/QUARTERLY/ABC_DRIVEN |
| `CycleCountLine` | System vs counted qty, variance, auto-adjust option |
| `CountSchedulerMetric` | Scheduler performance |

### Customization Engine (4 models)
| Model | Purpose |
|---|---|
| `WmsStateMachine` | XState definition JSON, versioned, per entity type |
| `WmsRule` | ZenEngine-compatible rule definition JSON, versioned |
| `WmsBpmnProcess` | BPMN 2.0 XML, versioned |
| `WmsExecutionInstance` | Active execution tracking (all 3 engine types), with context ring-buffer |

### Infra (7 models)
| Model | Purpose |
|---|---|
| `SystemSetting` / `SystemSettingHistory` | Tenant config key-value with audit trail |
| `SupervisorPin` | PIN-based override for location validation |
| `DbRfSession` | RF session DB persistence (fallback when Redis is lost) |
| `WmsReportJob` | Async report generation tracking |
| `ExternalEntityMapping` / `IntegrationSyncLog` / `SyncWebhookLog` | External platform entity mapping, sync audit, webhook dedup |
| `ResourceQuota` | Per-tenant resource usage tracking |
| `AdjustmentApproval` / `ApprovalThresholdConfig` | Versioned approval thresholds (auto/supervisor/manager/director) |

---

## 4. Complete API Reference

**Prefix convention**: `/api/v1/wms/` or `web/` / `rf/` at app root.

**Authentication header**: `Authorization: Bearer <jwt>` + `X-Tenant-Code: <tenantCode>` (Web and RF).
**RF also requires**: `x-rf-session-id: <sessionId>` header on every request after login.

### 4.1 Health (no auth, no Swagger)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness + health check |
| `GET` | `/health/ready` | Readiness probe |
| `GET` | `/health/circuits` | Circuit breaker states |

### 4.2 Warehouse / Master Data

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `web/facilities` | CASL Read on WarehouseFacility | List facilities with zone counts |
| `GET` | `rf/facilities` | RfSession + RfAction | List facilities (minimal RF projection) |
| `GET` | `web/zones` | CASL Read on WarehouseZone | List zones, optional `?facilityId=` |
| `GET` | `rf/zones` | RfSession + RfAction | List zones (minimal fields) |
| `GET` | `web` | CASL Read on StorageLocation | List locations with filters |
| `GET` | `web/by-code/:code` | CASL Read | Find location by barcode/code |
| `POST` | `web` | CASL Create on StorageLocation | Create location (quota-checked) |
| `PATCH` | `web/:id` | CASL Update | Update location (activate/block/parent) |
| `GET` | `web/:id/children` | CASL Read | Get child locations (recursive tree) |
| `POST` | `web/code-migrate` | CASL Update | Bulk location code prefix rename |
| `GET` | `rf` | RfSession + RfAction | List locations (RF projection) |
| `GET` | `rf/by-code/:code` | RfSession + RfAction | Lookup location by scanned code |
| `GET` | `web/settings` | CASL Read on SystemSetting | List all settings |
| `GET` | `web/settings/:key` | CASL Read | Get setting by key |
| `POST` | `web/settings/:key` | CASL Create | Upsert setting |
| `DELETE` | `web/settings/:key` | CASL Delete | Delete setting |

### 4.3 Products

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `web/products` | CASL Read | List/filter products (paginated) |
| `POST` | `web/products` | CASL Create + Quota | Create product with barcodes & attributes |
| `PATCH` | `web/products/:id` | CASL Update | Update product |
| `DELETE` | `web/products/:id` | CASL Delete | Soft-delete product |
| `GET` | `web/products/tree` | CASL Read | Get category tree |
| `POST` | `web/products/import` | CASL Create | Upload CSV/XLSX for bulk import |
| `GET` | `web/products/import/:jobId` | CASL Read | Get import job status |
| `GET` | `web/products/import/:jobId/errors.csv` | CASL Read | Download error CSV |
| `GET` | `rf/products/barcode/:code` | RfSession + RfAction | Lookup product by scanned barcode |
| `GET` | `rf/products/:id` | RfSession + RfAction | Get product by ID (RF projection) |

### 4.4 Inventory

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/wms/web/inventory/stock` | CASL Read | Query on-hand stock (filterable) |
| `GET` | `/api/v1/wms/web/inventory/low-stock` | CASL Read | Get low-stock items (below reorder+safety) |
| `POST` | `/api/v1/wms/web/inventory/adjustments` | CASL Create | Create adjustment draft |
| `GET` | `/api/v1/wms/web/inventory/adjustments` | CASL Read | List adjustments |
| `PATCH` | `/api/v1/wms/web/inventory/adjustments/:id/submit` | CASL Update | Submit for approval (auto-approve routes to APPROVED or PENDING_APPROVAL) |
| `PATCH` | `/api/v1/wms/web/inventory/adjustments/:id/approve` | CASL Approve | Approve adjustment (creates txn + updates on-hand) |
| `GET` | `/api/v1/wms/web/inventory/holds` | CASL Read | List inventory holds |
| `POST` | `/api/v1/wms/web/inventory/policies` | CASL Create | Upsert reorder/safety stock policy |
| `POST` | `/api/v1/wms/web/inventory/alerts/trigger` | CASL Manage | Enqueue low-stock alert check |
| `POST` | `/api/v1/wms/rf/inventory/scan-location` | RfSession + RfAction | Scan location for stock view (RF) |
| `POST` | `/api/v1/wms/rf/inventory/transaction/putaway` | RfSession + RfAction | Execute putaway transaction (RF) |
| `POST` | `/api/v1/wms/rf/inventory/transaction/pick` | RfSession + RfAction | Execute pick transaction (RF) |
| `POST` | `/api/v1/wms/rf/inventory/adjustment/quick` | RfSession + RfAction | Quick on-the-spot adjustment (RF) |
| `GET` | `/api/v1/wms/rf/inventory/lot/:lotNumber` | RfSession + RfAction | Lookup lot by number (RF) |

### 4.5 Inbound

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/wms/web/inbound/asn` | CASL Create | Create ASN with lines |
| `GET` | `/api/v1/wms/web/inbound/asn/:id/preview` | CASL Read | Preview ASN receipt (remaining qtys) |
| `PATCH` | `/api/v1/wms/web/inbound/asn/:id/status` | CASL Update | Transition ASN status (state machine) |
| `POST` | `/api/v1/wms/web/inbound/grn/from-asn` | CASL Create | Create GRN from ASN |
| `POST` | `/api/v1/wms/web/inbound/grn/ad-hoc` | CASL Create | Create ad-hoc GRN |
| `GET` | `/api/v1/wms/web/inbound/grn/:id` | CASL Read | Get GRN progress |
| `POST` | `/api/v1/wms/web/inbound/qc/inspect` | CASL Update | Record QC inspection |
| `GET` | `/api/v1/wms/web/inbound/putaway/board` | CASL Read | Putaway task board (filterable) |
| `POST` | `/api/v1/wms/web/inbound/disposition/apply` | CASL Approve | Apply QC disposition (ACCEPT/QUARANTINE/RTV/DESTROY) |
| `POST` | `/api/v1/wms/rf/inbound/receive/start` | RfSession | Start receiving (by ASN or open lines) |
| `POST` | `/api/v1/wms/rf/inbound/receive/scan` | RfSession | Receive line scan (creates LPN, updates inventory) |
| `POST` | `/api/v1/wms/rf/inbound/receive/complete` | RfSession | Complete receipt |
| `POST` | `/api/v1/wms/rf/inbound/qc/scan` | RfSession | Scan LPN for QC lookup |
| `POST` | `/api/v1/wms/rf/inbound/qc/result` | RfSession | Submit QC result (PASSED/FAILED) |
| `GET` | `/api/v1/wms/rf/inbound/putaway/next` | RfSession | Get next assigned putaway task |
| `POST` | `/api/v1/wms/rf/inbound/putaway/confirm` | RfSession + LocationValidationGuard | Confirm putaway (with PIN override for deviation) |

### 4.6 Outbound

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/wms/web/outbound/orders` | CASL Create + Quota | Create sales order |
| `GET` | `/api/v1/wms/web/outbound/orders` | CASL Read | List orders (filterable) |
| `GET` | `/api/v1/wms/web/outbound/allocations/pending` | CASL Read | Get pending soft allocations |
| `POST` | `/api/v1/wms/web/outbound/waves` | CASL Create | Create picking wave |
| `GET` | `/api/v1/wms/web/outbound/waves/board` | CASL Read | Wave board |
| `POST` | `/api/v1/wms/web/outbound/shipments/generate-manifest` | CASL Update | Generate shipment manifest |
| `POST` | `/api/v1/wms/web/outbound/allocations/override` | CASL Approve + AllocationOverrideGuard | Supervisor override allocation (substitute lot/location) |
| `GET` | `/api/v1/wms/rf/outbound/pick/next` | RfSession | Get next pick task |
| `POST` | `/api/v1/wms/rf/outbound/pick/assign` | RfSession | Assign pick task |
| `POST` | `/api/v1/wms/rf/outbound/pick/scan-location` | RfSession | Validate pick location scan |
| `POST` | `/api/v1/wms/rf/outbound/pick/scan-product` | RfSession | **STUB** — Always returns `{ scanned: true }`, no actual product verification |
| `POST` | `/api/v1/wms/rf/outbound/pick/confirm` | RfSession | Confirm pick (supports short-pick + backorder) |
| `POST` | `/api/v1/wms/rf/outbound/pick/recover` | RfSession | Recover interrupted pick session (Redis-based) |
| `POST` | `/api/v1/wms/rf/outbound/pack/start` | RfSession | Start packing session |
| `POST` | `/api/v1/wms/rf/outbound/pack/scan-lpn` | RfSession | Scan LPN into container |
| `POST` | `/api/v1/wms/rf/outbound/pack/seal` | RfSession | Seal container |
| `POST` | `/api/v1/wms/rf/outbound/ship/load` | RfSession | Assign shipment to load (dock door) |
| `POST` | `/api/v1/wms/rf/outbound/ship/dispatch` | RfSession | Confirm dispatch (all shipments in load → SHIPPED) |
| `POST` | `/api/v1/wms/rf/outbound/ship/print-generic-label` | RfSession | Stamp generic label metadata (no ZPL gen) |

### 4.7 Transfers

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/wms/web/transfers` | CASL Create | Create inventory transfer |
| `POST` | `/api/v1/wms/web/transfers/:id/dispatch` | CASL Update | Dispatch transfer (decrements source inventory) |
| `GET` | `/api/v1/wms/web/transfers` | CASL Read | List transfers |
| `POST` | `/api/v1/wms/rf/transfers/initiate` | RfSession | Initiate transfer receipt (RF) |
| `POST` | `/api/v1/wms/rf/transfers/scan-lpn` | RfSession | Scan arriving LPN (RF) |
| `POST` | `/api/v1/wms/rf/transfers/complete` | RfSession | Complete transfer receipt (reconcile) |

### 4.8 Cycle Counts

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/wms/web/cycle-counts/schedule` | CASL Create | Schedule cycle count (by zone/product/ABC) |
| `GET` | `/api/v1/wms/web/cycle-counts` | CASL Read | List cycle counts |
| `POST` | `/api/v1/wms/rf/cycle-counts/start` | RfSession | Start assigned count |
| `POST` | `/api/v1/wms/rf/cycle-counts/scan-location` | RfSession | Scan count location |
| `POST` | `/api/v1/wms/rf/cycle-counts/enter-qty` | RfSession | Enter counted quantity |
| `POST` | `/api/v1/wms/rf/cycle-counts/submit-line` | RfSession | Submit count line |
| `POST` | `/api/v1/wms/rf/cycle-counts/complete` | RfSession | Finalize count (triggers variance pipeline) |

### 4.9 Approvals

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/wms/web/approvals/pending` | CASL Read | Get pending adjustment approvals |
| `POST` | `/api/v1/wms/web/approvals/:id/approve` | CASL Approve | Approve adjustment |
| `POST` | `/api/v1/wms/web/approvals/:id/reject` | CASL Approve | Reject adjustment with reason |

### 4.10 Notifications

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/wms/web/notifications/logs` | CASL Read | Get notification audit logs |
| `POST` | `/api/v1/wms/web/notifications/test` | CASL Create | Send test notification |
| `GET` | `/api/v1/wms/web/notifications/compliance-overrides` | CASL Read | Compliance override log |
| `GET` | `/api/v1/wms/web/notifications/preferences` | CASL Read | Proxy to core API preferences |
| `POST` | `/api/v1/wms/rf/notifications/poll` | RfSession | Poll for unread notifications (ETag dedup) |

### 4.11 Reports

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/wms/web/reports/request` | CASL Read + Quota | Request async report (returns jobId) |
| `GET` | `/api/v1/wms/web/reports/status/:jobId` | CASL Read | Poll report generation status |
| `GET` | `/api/v1/wms/web/reports/download/:jobId` | CASL Read + Quota | Download completed report |
| `GET` | `/api/v1/wms/web/reports/download` | CASL Read + Quota | Live streaming report download |
| `GET` | `/api/v1/wms/web/reports/templates/:reportType` | CASL Read | Get report template/parameter metadata |

**Report types**: STOCK_ON_HAND, MOVEMENT_HISTORY, VELOCITY_ABC, AGING_ANALYSIS, DAILY_KPI, LOCATION_UTILIZATION

### 4.12 RF Sessions

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `rf/sessions/start` | Public (JWT optional) | Create RF session (returns sessionId) |
| `POST` | `rf/sessions/:id/step` | RfSession | Advance workflow step |
| `POST` | `rf/sessions/:id/resume` | RfSession | Resume session |
| `POST` | `rf/sessions/:id/complete` | RfSession | Complete session |
| `POST` | `rf/sessions/:id/extend` | RfSession | Extend session TTL |
| `GET` | `rf/sessions/:id` | RfSession | Get session state |

### 4.13 Scanner

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/wms/scanner/session/login` | ScannerAuthGuard | Scanner device login |
| `POST` | `/api/v1/wms/scanner/validate` | ScannerAuthGuard | Validate scanned barcode format |
| `POST` | `/api/v1/wms/scanner/lookup/product` | ScannerAuthGuard | Lookup product by barcode |
| `POST` | `/api/v1/wms/scanner/lookup/location` | ScannerAuthGuard | Lookup location by barcode |
| `POST` | `/api/v1/wms/scanner/telemetry` | ScannerAuthGuard | Record device telemetry |

### 4.14 Customization Engine

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `web/customization/state-machines` | CASL Read | List state machines |
| `GET` | `web/customization/state-machines/:key` | CASL Read | Get machine definition (cached) |
| `POST` | `web/customization/state-machines` | CASL Create | Create state machine (versioned) |
| `PATCH` | `web/customization/state-machines/:key` | CASL Update | Update machine (new version) |
| `POST` | `web/customization/state-machines/:key/validate` | CASL Read | Validate XState definition |
| `POST` | `web/customization/state-machines/:key/test` | CASL Read | Test state transition |
| `POST` | `web/customization/state-machines/:key/rollback/:version` | CASL Update | Rollback to version |
| `GET` | `web/customization/rules` | CASL Read | List rules |
| `GET` | `web/customization/rules/:key` | CASL Read | Get rule definition |
| `POST` | `web/customization/rules` | CASL Create | Create rule |
| `PATCH` | `web/customization/rules/:key` | CASL Update | Update rule |
| `POST` | `web/customization/rules/:key/evaluate` | CASL Read | Evaluate rule with input data |
| `POST` | `web/customization/rules/:key/rollback/:version` | CASL Update | Rollback rule |
| `GET` | `web/customization/processes` | CASL Read | List BPMN processes |
| `GET` | `web/customization/processes/:key` | CASL Read | Get BPMN process XML |
| `POST` | `web/customization/processes` | CASL Create | Create BPMN process |
| `PATCH` | `web/customization/processes/:key` | CASL Update | Update BPMN process |
| `POST` | `web/customization/processes/:key/parse` | CASL Read | Parse BPMN XML (bpmn-moddle) |
| `POST` | `web/customization/processes/:key/simulate` | CASL Read | **Create execution instance (no actual BPMN engine)** |
| `POST` | `web/customization/processes/:key/rollback/:version` | CASL Update | Rollback BPMN process |
| `GET` | `web/customization/executions` | CASL Read | List execution instances |
| `GET` | `web/customization/executions/:id` | CASL Read | Get execution instance |

### 4.15 Integrations / Webhooks

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/wms/webhooks/shopify/:tenantCode` | HMAC signature | Shopify webhook receiver |
| `POST` | `/api/v1/wms/webhooks/woocommerce/:tenantCode` | HMAC signature | WooCommerce webhook receiver |

---

## 5. User Roles & Permissions

### Role Definitions (from `src/casl/permission-registry.ts`)

| Role | Code | Description |
|---|---|---|
| **System Admin** | `SYSTEM_ADMIN` | Full `manage` on all subjects |
| **Tenant Admin** | `TENANT_ADMIN` (from Core JWT) | Bypasses WMS role checks — `manage` on `all` |
| **Warehouse Admin** | `WAREHOUSE_ADMIN` | Full CRUD on facilities, zones, locations, products, inventory, orders, customization engine, settings |
| **Warehouse Supervisor** | `WAREHOUSE_SUPERVISOR` | Read on all, update products, approve adjustments, release waves, override allocations, manage cycle count schedule |
| **Warehouse Operator** | `WAREHOUSE_OPERATOR` | **RF floor user** — read products/facilities/locations/inventory, receive/pick/pack/ship/adjust, cycle count, transfers, barcode validate |
| **Inventory Clerk** | `INVENTORY_CLERK` | Count/adjust inventory, manage lots, read products, manage attributes |
| **Scanner User** | `SCANNER_USER` | Validate barcode, lookup product/location/LPN/inventory, read product and location |

### Authorization flow (per request)

**Web**: `WmsThrottlerGuard` (global) → `JwtAuthGuard` → `CaslGuard` (reads `@CheckAbility()` decorator against `req.ability`)
**RF**: `WmsThrottlerGuard` (global) → `JwtAuthGuard` → `RfSessionGuard` (validates `x-rf-session-id`) → `RfActionLightweightGuard` (checks `@RfAction()` against session user's roles)
**Scanner**: `ScannerAuthGuard` (device ID + token from Redis)

### PIN-restricted users
If `jwtPayload.authMethod === 'pin'`, the CASL ability factory restricts: no Create, Update, Delete, Approve — only Read and warehouse-floor actions (pick, pack, receive, ship).

---

## 6. Web User Capabilities (by Role)

### 6.1 Planner (`WAREHOUSE_OPERATOR`)

**Dashboard views needed**:
- Putaway board (filterable task list with priority sorting)
- Wave board (waves with total/completed tasks)
- Cycle count schedule
- Low-stock alerts
- Pending allocations

**Operations**:
- Create sales orders (quota-gated)
- View/list orders with line-level status rollups
- View pending soft allocations
- Trigger low-stock alert check
- Create ASNs, preview ASN receipt
- View GRN progress
- Create inventory transfer requests
- Schedule cycle counts
- View inventory stock per location/product/lot
- Create adjustment drafts
- View inventory holds
- Search products, view category tree
- Request/download reports (SOH, Movement, ABC, Aging, KPI, Utilization)

### 6.2 Warehouse Tenant Admin (`TENANT_ADMIN` or `WAREHOUSE_ADMIN`)

**All Planner capabilities plus**:

**Master Data Management**:
- Full CRUD: facilities, zones, storage locations (including bulk code migration)
- Full CRUD: products, categories, barcodes, attributes
- Bulk product import via CSV/XLSX with per-row error download
- System settings (key-value configuration)
- Location hierarchy management (parent/children)

**Inventory Control**:
- Approve/reject inventory adjustments (creates transactions + updates on-hand)
- Manage holds (create/release with dispositions)
- Set inventory policies (reorder point, max stock, safety stock)
- Override allocations (substitute lot/location with reason) — requires supervisor-level

**Advanced Operations**:
- Allocation override (guarded by `AllocationOverrideGuard`)
- QC disposition application (ACCEPT / QUARANTINE / RETURN_TO_VENDOR / DESTROY)
- View notification audit logs
- Send test notifications

**Customization Engine**:
- Create/edit/version/rollback XState state machines
- Create/edit/version/rollback ZenEngine decision rules
- Evaluate rules with sample input
- Test state machine transitions
- Create/edit/version/rollback BPMN 2.0 processes
- Parse and validate BPMN XML
- List execution instances for all engines
- Rollback any definition to a previous version

### 6.3 Warehouse Supervisor (`WAREHOUSE_SUPERVISOR`)

**Read access to all data** plus:
- Approve adjustments (that are in PENDING_APPROVAL)
- Release picking waves (generates zone-sorted picking tasks)
- Override allocations (substitute lot/location)
- Approve/reject approval requests
- Manage cycle count scheduling
- Trigger sync for integrations
- View webhook logs
- Update products (limited)

### 6.4 System Admin (`SYSTEM_ADMIN`)

**All capabilities** plus:
- View full integration sync logs
- View webhook logs
- Full `manage` across all subjects

---

## 7. RF (Handheld) User Capabilities

RF users operate through **stateful sessions** with a step-based workflow. Every action is gated by `x-rf-session-id`.

### Session Lifecycle
1. **Login**: `POST rf/sessions/start` → receive `sessionId`
2. **Work**: `POST rf/sessions/:id/step` on each action (advances step counter)
3. **Complete**: `POST rf/sessions/:id/complete`
4. **Timeout**: Session auto-expires after 15 min idle. Can be extended via `POST .../extend`. If Redis data is lost, sessions auto-recover from DB.

### Inbound Receiving
- **Start receiving**: By ASN number or view all open receiving lines
- **Scan receive**: Scan product → enter qty → location → lot/expiry (auto-creates LPN + inventory transaction)
- **Complete**: Finishes the GRN (triggers putaway generation)
- **QC Scan**: Scan LPN to view for QC
- **QC Result**: Submit PASSED/FAILED (failed → quarantine hold)
- **Putaway Next**: Get highest-priority assigned putaway task
- **Putaway Confirm**: Scan destination location → confirm (with supervisor PIN override if deviating from suggested)

### Outbound Fulfillment
- **Pick Next**: Get next assigned pick task (zone-sorted, sequence-ordered)
- **Pick Assign**: Claim a pick task (Redis-locked to prevent double assignment)
- **Pick Scan Location**: Validate location barcode matches task
- **Pick Scan Product**: **STUB** — always returns verified
- **Pick Confirm**: Enter actual picked qty (supports short-picks → backorder line)
- **Pick Recover**: Resume interrupted pick session (Redis recovery state)
- **Pack Start**: Begin packing session at workstation
- **Pack Scan LPN**: Scan picked LPNs into shipping container
- **Pack Seal**: Seal container (records weight)
- **Ship Load**: Assign sealed containers to a load/dock door
- **Ship Dispatch**: Confirm shipment as dispatched (marks all shipment records as SHIPPED)
- **Print Label**: Stamps generic ZPL metadata (no actual ZPL generation)

### Inventory (RF)
- **Scan Location**: View all stock at a location (product, lot, qty)
- **Transaction Putaway/Pick**: Direct inventory movement transactions
- **Quick Adjustment**: Spot quantity correction without the full approval workflow
- **Lot Lookup**: Search lots by lot number

### Transfers (RF)
- **Initiate Receive**: Start receiving a transfer
- **Scan LPN**: Scan arriving LPNs → matches against transfer lines
- **Complete**: Finalize transfer (increments destination inventory, flags discrepancies)

### Cycle Counting (RF)
- **Start**: Begin an assigned cycle count
- **Scan Location**: Scan the location being counted
- **Enter Qty**: Input the physical count
- **Submit Line**: Submit the count line (system calculates variance)
- **Complete**: Finalize all lines → triggers approval pipeline for variances

### Notifications (RF)
- **Poll**: Fetch unread notifications for the current session (ETag-based dedup)

### Lookups (RF)
- Scan barcode for product lookup (returns RF projection — minimal fields)
- Scan location code for location info
- Scan LPN barcode for LPN status/location

---

## 8. Key Gaps & Design/Development Pending

The following items were identified during source verification as either missing, stubbed, or aspirational.

### 8.1 BPMN Engine Not Integrated ⚠️

| Issue | Details |
|---|---|
| **`bpmn-engine` is installed but unused** | `package.json` includes `"bpmn-engine": "^25.0.1"` but `BpmnService` never imports it. `startProcess()` creates a DB record + emits events; actual BPMN execution (token flow, service tasks, gateways, timers) does not happen. |
| **`simulate` is not a simulation** | `POST .../bpmn/:key/simulate` calls `startProcess()` — same as starting a real execution. No dry-run or walkthrough mode. |
| **No service task execution** | `WorkflowOrchestratorService` registers 4 handlers (`evaluateRule`, `transitionStateMachine`, `checkInventory`, `createAuditLog`) but the BPMN engine never invokes them since it's not wired to `handleServiceTask()`. |
| **Fix path** | Integrate `bpmn-engine` into `BpmnService`, wire `handleServiceTask()` as a listener for BPMN service task callbacks. For simulation, create a sandbox mode that token-walks without persisting. |

### 8.2 Stubbed Endpoints ⚠️

| Endpoint | Issue |
|---|---|
| `POST /api/v1/wms/rf/outbound/pick/scan-product` | Always returns `{ scanned: true, message: 'Product verified' }`. No actual product barcode verification against the pick task. |

### 8.3 Missing Domain Features

| Domain | Gap |
|---|---|
| **Supplier/Vendor Management** | `vendorId` exists as a plain string field. No vendor profiles, scorecards, ASN routing rules, or purchase order management beyond ASN/GRN. |
| **Dock Scheduling / Yard Management** | `dockDoorCode` on shipments but no appointment scheduling, dock door availability, or yard check-in/out. |
| **Label Printing** | `printGenericLabel()` writes metadata only. No ZPL generation, no label template management, no print job queue. |
| **Serial Number Tracking** | `trackSerial` exists on `Product` model but there is no serial number service, no serial scan/validation at pick/pack, no serial inventory tracking. |
| **Order Hold/Release Flow** | `ON_HOLD` is a valid order status but there is no order hold/release endpoint or flow in the controllers. The status can be set directly but no gated workflow. |
| **Order Cancellation** | `CANCELLED` is a valid status but there's no cancellation endpoint (no release allocations, restore inventory). |
| **Wave Planning Optimization** | `releaseWave` generates zone-sorted tasks but no optimization algorithm (no batch grouping, no travel path optimization, no task interleaving). |
| **Dashboard / KPI Endpoints** | No dedicated aggregate endpoints for "today's receiving throughput", "picking productivity", "order fulfillment rate", etc. Data is available but no frontend-friendly summary endpoints exist. |
| **Cross-facility RF Session** | RF sessions don't track which facility the user is currently operating in. Each endpoint requires `facilityId` as a body/query parameter. |

### 8.4 Customization Engine Gaps

| Area | Gap |
|---|---|
| **State Machine → Domain Hooks** | Transitions emit events (`wms.statemachine.transition`) but there's no mechanism to *block* a transition based on rule evaluation, or to *trigger side effects* (e.g., auto-create a putaway task when ASN status reaches "ARRIVED"). The state machine is purely decorative in terms of driving domain behavior. |
| **Rule Engine → Action Execution** | Rule evaluation returns a result object but there's no framework to *execute* the result as an action (e.g., `{ action: "HOLD_ORDER", reason: "Credit limit exceeded" }`). `WorkflowOrchestratorService` only handles 4 hardcoded service tasks. |
| **Context Resolution Limits** | `RuleEngineService.resolveContext()` only handles 3 context key patterns: `inventory.onHand`, `carrier.rate`, `product.*`. Other context keys resolve to `null`. This is extensible in code but not tenant-configurable. |
| **BPMN → Actual Execution** | No BPMN runtime engine (see 8.1). The store-and-emit approach means BPMN processes are essentially documentation with execution records, not automatable workflows. |
| **No Schedule/Trigger Integration** | Rules and state machines can only be triggered via API. There's no cron-based trigger, no webhook-to-rule mapping, no event-condition-action (ECA) framework. |

### 8.5 Reporting Gaps

| Area | Gap |
|---|---|
| **Movement History report** | ✅ Confirmed — the `extract()` cursor-based generator works, queries inventory_transactions |
| **Live downloads** | ✅ Confirmed — streaming CSV/Excel downloads for 4 report types (SOH, Movement, Velocity, Aging) |
| **S3 upload** | ✅ Confirmed — `S3UploadService` with presigned URLs, multipart upload |
| **No real-time dashboard** | No "live" KPI endpoint. Reports are async batch only (except the "live download" which is still a batch query). |

---

## 9. Frontend Development Considerations

### 9.1 Recommended Application Architecture

Build two separate SPA experiences (or two route trees):

```
wms-frontend/
├── web/                          # Desktop dashboard
│   ├── pages/
│   │   ├── dashboard/            # KPIs, charts, summaries
│   │   ├── inbound/              # ASN/GRN management, putaway board
│   │   ├── outbound/             # Orders, allocations, waves, shipments
│   │   ├── inventory/            # Stock view, adjustments, holds, policies
│   │   ├── products/             # Product catalog, categories, import
│   │   ├── transfers/            # Transfer management
│   │   ├── counts/               # Cycle count scheduling
│   │   ├── approvals/            # Pending approvals, approve/reject
│   │   ├── reports/              # Request, poll, download reports
│   │   ├── warehouse/            # Facilities, zones, location management
│   │   ├── settings/             # System settings, notification logs
│   │   └── customization/        # State machines, rules, BPMN processes
│   └── components/
│       ├── layout/               # Sidebar, topbar, role-based nav
│       ├── shared/               # Tables, filters, forms, barcode input
│       └── widgets/              # KPIs, status badges, timeline
│
├── rf/                           # Mobile/handheld PWA
│   ├── pages/
│   │   ├── session/              # Login, session management
│   │   ├── inbound/              # Receive, QC, putaway
│   │   ├── outbound/             # Pick, pack, ship
│   │   ├── inventory/            # Stock lookup, quick adjust, lot lookup
│   │   ├── transfers/            # Transfer receive
│   │   ├── counts/               # Cycle count execution
│   │   └── notifications/        # Notification polling
│   └── components/
│       ├── layout/               # Minimal header, progress bar
│       ├── scanner/              # Barcode input (camera + keyboard wedge)
│       ├── workflow/             # Step indicator, confirm dialog
│       └── shared/               # Large buttons, simple tables
│
└── shared/                       # API client, auth, types
    ├── api/                      # Generated OpenAPI client
    ├── types/                    # Shared TypeScript types
    └── auth/                     # JWT + tenant code management
```

### 9.2 Auth Flow Differences

| Aspect | Web | RF |
|---|---|---|
| **First request** | JWT from Core SaaS platform + `X-Tenant-Code` header | JWT from Core → `POST rf/sessions/start` to get `sessionId` |
| **Subsequent requests** | Same JWT (stateless) | JWT + `x-rf-session-id: <sessionId>` header |
| **Session expired** | Redirect to Core login | API returns 401 → restart session |
| **Tenant context** | `X-Tenant-Code` header (validated against Redis cache) | Same header |
| **Rate limiting** | Global `WmsThrottlerGuard` (configurable TTL/limit) | `RfRateLimiterGuard` (burst 500/10s, sustained 50/sec) |

### 9.3 Important Conventions

1. **All Web POST/PUT endpoints are quota-gated** — check `ResourceQuota` before creating resources. The API will return 429 if quota exceeded.

2. **RF workflows are multi-step** — You must manage workflow state on the client. E.g., picking is: `assign` → `scan-location` → `scan-product` (stub) → `confirm`. Each step returns `nextTask` which can be `null` (no more work) or a new task.

3. **Reports are async** — `POST /reports/request` returns a `jobId`. Poll `GET /reports/status/:jobId` until `status === 'COMPLETED'`, then download via `GET /reports/download/:jobId`.

4. **Swagger is your live reference** — Start the app with `SWAGGER_ENABLED=true` in `.env` and browse `/api/docs`.

5. **OpenAPI client generation** — Pre-generated specs exist at `generated-client/openapi-specs/`. AI prompts for component generation at `generated-client/ai-prompts/`.

6. **All timestamps are ISO 8601** — The API accepts and returns ISO 8601 date strings. Timezone conversion is the client's responsibility (except report params which accept timezone).

7. **Pagination convention** — All list endpoints use `page` (1-based) and `limit` (max 200, default 50). Response shape: `{ data: [], total: number, page?: number, limit?: number }`.

8. **Error format** — RFC 7807 Problem Details (`application/problem+json`) with `type`, `title`, `status`, `detail`, `instance` fields.

9. **Idempotency** — Some POST endpoints support idempotency via `Idempotency-Key` header (configurable TTL, default 5 min).

---

## 10. Appendix: Verified Capability Cross-Reference

| Claim | Source File | Lines | Verified |
|---|---|---|---|
| FEFO lot picking (expiry date ordering) | `inventory-onhand.service.ts` | 63-98 | ✅ |
| LPN nesting with cycle detection | `lpn.service.ts` | 35-95 | ✅ |
| ASN status state machine | `asn.service.ts` | 6-15, 61-96 | ✅ |
| Putaway with supervisor PIN override | `putaway.service.ts` | 94-151 | ✅ |
| QC Passed/Failed with hold placement | `qc.service.ts` | 27-68 | ✅ |
| Soft→Hard allocation with FEFO | `allocation.service.ts` | 15-121 | ✅ |
| Short-pick with backorder | `picking.service.ts` | 52-143 | ✅ |
| Wave release → zone-sorted tasks | `wave.service.ts` | 36-138 | ✅ |
| Cycle count freeze/release locations | `cycle-count.service.ts` | 227-251 | ✅ |
| BPMN validation (no scriptTask) | `bpmn.service.ts` | 147-167 | ✅ |
| XState validate + execute | `state-machine.service.ts` | 156-182, 71-154 | ✅ |
| ZenEngine + JDM fallback engine | `rule-engine.service.ts` | 60-67, 137-148, 171-175 | ✅ |
| Redis optimistic locking for txn | `inventory-transaction.service.ts` | 17-120 | ✅ |
| Daily reconciliation drift detection | `inventory-reconciliation.service.ts` | 15-79 | ✅ |
| Workflow orchestrator (3 engines) | `workflow-orchestrator.service.ts` | 52-82 | ✅ |
| Inventory transaction 17 types | `inventory-transaction.service.ts` | 122-128 | ✅ |
| ABC velocity classification | `velocity-abc.service.ts` | 139-163 | ✅ |
| Shopify + WooCommerce adapters | `shopify.adapter.ts`, `woocommerce.adapter.ts` | Full files | ✅ |
| Cursor-based streaming reports | `stock-on-hand.service.ts`, `movement-history.service.ts`, `aging.service.ts` | Full files | ✅ |
