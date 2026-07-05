# Inbound Receiving — RF Implementation Plan

**Reference:** Manhattan_RF_Operations_Suite_v1 Parts 1-2  
**Existing Code:** `src/inbound/receiving/` — RfReceivingController (9 endpoints), ReceivingService (15 methods)  
**Status:** 80% Complete — core receiving workflow is solid; missing trailer management, tolerance config, structured damage handling, and returns PO controllers  

---

## Summary of Manhattan Process

```
Trailer Check-In → Dock Assignment → ASN Verification → Unload → Scan Item → Enter Qty
→ Over/Under Tolerance Check → Damage Handling → Create LPN → Stage → Complete (→ Putaway)
```

---

## GAP-1: Missing Trailer Check-In / Arrival Management

**Manhattan Reference:** Step 1 — "Check In Trailer"  
**Current State:** No trailer arrival entity or endpoint. Dock assignment (`assignDockDoor`) exists but no preceding trailer check-in.  
**Impact:** No audit trail for when a trailer arrived. No access control for dock assignment (anyone can assign a dock without verifying trailer arrival).

### Tasks

#### GAP-1.1: Create `trailers` Prisma model (if not present)
- **File:** `prisma/schema.prisma`
- Add `inbound_trailers` table with: `trailer_id` (PK, auto), `tenant_id`, `facility_id`, `trailer_number` (unique per facility), `carrier_id`, `status` (ARRIVED/AT_DOCK/LOADING/CLOSED/DEPARTED), `arrival_time`, `departure_time`, `seal_number`, `created_at`, `updated_at`

#### GAP-1.2: Trailer Service
- **File:** `src/inbound/trailers/trailer.service.ts`
- Methods: `checkIn` (create/arrive trailer), `findAll`, `findById`, `assignDock`, `depart`, `close`

#### GAP-1.3: RF Trailer Check-In Endpoint
- **File:** `src/inbound/trailers/rf/trailer.controller.ts`
- Route: `POST rf/inbound/trailer/check-in` — scan/enter trailer number, record arrival
- Route: `POST rf/inbound/trailer/assign-door` — move existing trailer to dock (refactor from receiving controller)
- Route: `POST rf/inbound/trailer/depart` — mark trailer departed

#### GAP-1.4: Web Trailer Endpoints
- **File:** `src/inbound/trailers/web/trailer.controller.ts`
- CRUD: POST/GET/PATCH `/web/trailers[/:id]`

#### GAP-1.5: Update RfReceivingController
- **File:** `src/inbound/receiving/rf/receiving.controller.ts`
- Modify `assign-do-or` to accept `trailerId` and validate trailer is in ARRIVED status
- Add trailer context to receiving session

---

## GAP-2: Missing Over/Under Receipt Tolerance Configuration

**Manhattan Reference:** Steps 9-10 — tolerance-based auto-accept, supervisor escalation  
**Current State:** Variance is classified (NONE/OVER/SHORT/DAMAGED) in `receiveLine()` but no configurable tolerance levels. No supervisor approval flow.  
**Impact:** All variances are processed silently. No approval gates for large discrepancies.

### Tasks

#### GAP-2.1: Create `receiving_tolerance_configs` Prisma model
- **File:** `prisma/schema.prisma`
- Fields: `config_id`, `tenant_id`, `facility_id`, `product_id` (nullable), `vendor_id` (nullable), `tolerance_type` (PERCENTAGE/ABSOLUTE), `over_tolerance`, `under_tolerance`, `requires_supervisor_approval`, `is_active`

#### GAP-2.2: Create Receiving Tolerance Service
- **File:** `src/inbound/receiving/receiving-tolerance.service.ts`
- Methods: `getToleranceConfig` (cascading: product-specific → vendor-specific → facility default), `isWithinTolerance`, `requiresApproval`

#### GAP-2.3: Create Receiving Approval Service + Web Endpoints
- **File:** `src/inbound/receiving/receiving-approval.service.ts`
- **File:** `src/inbound/receiving/web/receiving-approval.controller.ts`
- Methods: `createApproval`, `getPendingApprovals`, `approve`, `reject`
- Web: GET `/web/receiving-approvals/pending`, POST `/web/receiving-approvals/:id/approve`, POST `/web/receiving-approvals/:id/reject`

#### GAP-2.4: RF Supervisor Approval Endpoint
- **File:** `src/inbound/receiving/rf/receiving.controller.ts`
- Route: `POST rf/inbound/receive/approve-variance` — supervisor approves/rejects over/under variance
- Route: `POST rf/inbound/receive/pending-approvals` — list pending variance approvals

#### GAP-2.5: Integrate tolerance check into `receiveLine`
- **File:** `src/inbound/receiving/receiving.service.ts`
- After variance classification, check config. If outside tolerance → create approval record (block line completion), return `{ requiresApproval: true, approvalId }`. If within tolerance → process normally.

---

## GAP-3: Structured Damage Code Management

**Manhattan Reference:** Step 11 — Crushed Pallet, Water Damage, Broken Packaging  
**Current State:** Damage is handled with raw disposition strings (HOLD/SCRAP/RETURN_TO_VENDOR). No structured damage codes. No damage audit trail.  
**Impact:** Cannot analyze damage patterns across vendors/products.

### Tasks

#### GAP-3.1: Create `damage_codes` Prisma model
- **File:** `prisma/schema.prisma`
- Fields: `damage_code_id`, `tenant_id`, `code`, `description`, `category` (PACKAGING/PRODUCT/TRANSPORT/OTHER), `requires_qc`, `is_active`

#### GAP-3.2: Create Damage Code Service + Web Endpoints
- **File:** `src/inbound/receiving/damage-code.service.ts`
- **File:** `src/inbound/receiving/web/damage-code.controller.ts`
- CRUD: POST/GET/PATCH `/web/damage-codes[/:id]`

#### GAP-3.3: RF Damage Code Lookup
- **Route:** `POST rf/inbound/receive/damage-codes` — list active damage codes for RF device selection

#### GAP-3.4: Update `receiveLine` with damage code validation
- **File:** `src/inbound/receiving/receiving.service.ts`
- Accept `damageCodeId` in DTO; validate against `damage_codes` table; record in receipt transaction
- Create `damage_records` entry for audit trail

---

## GAP-4: Fill Receiving RF Gaps (Buy vs Build)

**Current State:** `RfReturnsController` is a stub (1 endpoint: lookup, no guards, hardcoded facilityId: '0'). `RfPurchaseOrderController` is minimal (1 endpoint: lookup, no guards).  
**Impact:** No RF return-receiving workflow. PO workflow is lookup-only.

### Tasks

#### GAP-4.1: Implement RfReturnsController
- **File:** `src/inbound/returns/rf/returns.controller.ts`
- Add `@UseGuards(RfSessionGuard, RfActionLightweightGuard)`
- Routes:
  - `POST rf/inbound/returns/lookup-rma` — lookup by RMA number
  - `POST rf/inbound/returns/receive` — receive returned item (scan SKU, enter qty, damage assessment)
  - `POST rf/inbound/returns/disposition` — set disposition (RESTOCK/REPAIR/SCRAP/RETURN_TO_VENDOR)
  - `POST rf/inbound/returns/complete` — complete return receipt, generate LPN for restock

#### GAP-4.2: Expand RfPurchaseOrderController
- **File:** `src/inbound/purchase-orders/rf/purchase-order.controller.ts`
- Add `@UseGuards(RfSessionGuard, RfActionLightweightGuard)`
- Routes:
  - `POST rf/purchase-orders/lookup` — already exists (enhance with line item display)
  - `POST rf/purchase-orders/start-receiving` — initiate PO-based receiving session

---

## GAP-5: RF Receiving `receive/stage` Stub Fix

**Manhattan Reference:** Step 12 — Move To Staging with scan validation  
**Current State:** `stageReceipt()` in service updates only `notes` field with staging location info as plain text.  
**Impact:** No proper staging location entity association. LPN not updated with staging location. Cannot query "items currently in staging".

### Tasks

#### GAP-5.1: Update `stageReceipt` for proper LPN staging
- **File:** `src/inbound/receiving/receiving.service.ts`
- Look up `storage_locations` by stagingLocationId
- Update all LPNs associated with the receipt: set `status='STAGED'`, `location_id=stagingLocationId`, `staging_location_id=stagingLocationId`
- Create `inventory_transactions` rows: type=STAGE, from_lpn to staging location
- Record staging timestamp

#### GAP-5.2: Add staging validation to RF endpoint
- **File:** `src/inbound/receiving/rf/receiving.controller.ts`
- `POST rf/inbound/receive/stage`: validate staging location is type `STAGING` or `RECEIVING_DOCK`, validate LPN is in RECEIVED status

---

## Summary: Files to Create/Update

### New Files
| # | File | Purpose |
|---|------|---------|
| 1 | `src/inbound/trailers/trailer.service.ts` | Trailer check-in, departure, dock assignment |
| 2 | `src/inbound/trailers/web/trailer.controller.ts` | Web CRUD for trailers |
| 3 | `src/inbound/trailers/rf/trailer.controller.ts` | RF trailer operations |
| 4 | `src/inbound/trailers/trailer.module.ts` | NestJS module |
| 5 | `src/inbound/receiving/receiving-tolerance.service.ts` | Tolerance config lookup |
| 6 | `src/inbound/receiving/receiving-approval.service.ts` | Approval creation, approve/reject |
| 7 | `src/inbound/receiving/web/receiving-approval.controller.ts` | Web approval endpoints |
| 8 | `src/inbound/receiving/damage-code.service.ts` | Damage code CRUD |
| 9 | `src/inbound/receiving/web/damage-code.controller.ts` | Web damage code endpoints |

### New Prisma Tables
| # | Table | Purpose |
|---|-------|---------|
| 1 | `inbound_trailers` | Trailer arrival and dock assignment tracking |
| 2 | `receiving_tolerance_configs` | Per-product/vendor/facility tolerance rules |
| 3 | `receiving_approvals` | Variance approval workflow records |
| 4 | `damage_codes` | Structured damage categorization |
| 5 | `damage_records` | Per-receipt damage audit trail |

### Updated Files
| # | File | Changes |
|---|------|---------|
| 1 | `src/inbound/receiving/receiving.service.ts` | Integrate tolerance checks, damage codes, proper staging |
| 2 | `src/inbound/receiving/rf/receiving.controller.ts` | Add supervisor approval, damage code lookup endpoints; trailer integration |
| 3 | `src/inbound/returns/rf/returns.controller.ts` | Full returns RF workflow (from stub) |
| 4 | `src/inbound/purchase-orders/rf/purchase-order.controller.ts` | Full PO RF workflow (from stub) |
| 5 | `src/inbound/inbound.module.ts` | Register new modules |
| 6 | `prisma/schema.prisma` | Add 5 new tables |
| 7 | `src/common/casl/casl-ability.factory.ts` | Add CASL subjects: 'Trailer', 'ReceivingApproval', 'DamageCode' |

### Web Updates
- Trailer CRUD endpoints (`/web/trailers`)
- Receiving approvals (`/web/receiving-approvals`)
- Damage codes (`/web/damage-codes`)

### RF Updates
- Trailer check-in: `POST rf/inbound/trailer/check-in`
- Supervisor approve variance: `POST rf/inbound/receive/approve-variance`
- Damage codes lookup: `POST rf/inbound/receive/damage-codes`
- Return receiving: `POST rf/inbound/returns/receive`, `/disposition`, `/complete`
- PO receiving: `POST rf/purchase-orders/start-receiving`

---

## Priority & Effort

| Priority | Item | Effort |
|----------|------|--------|
| HIGH | GAP-2: Tolerance config + approval workflow | Medium |
| HIGH | GAP-5: Proper staging implementation | Small |
| MEDIUM | GAP-3: Structured damage codes | Medium |
| MEDIUM | GAP-4: Returns/PO RF controllers | Medium |
| LOW | GAP-1: Trailer management | Medium |

---

## APPENDIX: Post-Verification Critical Missing Items

After thorough verification against Manhattan documents, the following items were identified as missing. They are appended to their respective GAPs above.

### APP-GAP-A: ASN Lifecycle Management (6-State Model)

**Manhattan States:** CREATED → RELEASED → IN_RECEIVING → PARTIALLY_RECEIVED → RECEIVED → CLOSED  
**Current State:** No ASN status model or status management mentioned in the plan.  
**Tasks to add:**
- Add `asn_status` enum to Prisma: `CREATED`, `RELEASED`, `IN_RECEIVING`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CLOSED`
- Add status field to `advance_ship_notices`
- On start receiving: transition status to IN_RECEIVING
- On each receiveLine: check if all lines received → PARTIALLY_RECEIVED or RECEIVED
- On completeReceipt: transition to RECEIVED → CLOSED after variances resolved
- Validate receiving only allowed on ASNs in RELEASED / IN_RECEIVING / PARTIALLY_RECEIVED states (NOT CLOSED)

### APP-GAP-B: Dock Validation Rules (Door Active / Available / Trailer Type)

**Manhattan:** Door must be ACTIVE, AVAILABLE, support trailer type.  
**Current State:** Missing from plan.  
**Tasks to add:**
- Add `is_active`, `is_available`, `supported_trailer_types` to `loading_docks`
- In `assignDockDoor`: validate door is active and available
- In `assignDockDoor`: validate trailer type compatibility
- Prevent assignment of occupied docks (check no active trailer assigned to door)

### APP-GAP-C: Ownership Transfer (Supplier → Warehouse)

**Manhattan:** Legal/financial event when carrier custody transfers to warehouse.  
**Current State:** Completely missing from plan.  
**Tasks to add:**
- Add `ownership_transfer` enum/flag on `goods_receipts` or `inventory_on_hand`
- Create `custody_events` Prisma table (entity_type, entity_id, from_party, to_party, event_type: CARRIER_TO_WAREHOUSE / WAREHOUSE_TO_CARRIER, timestamp, recorded_by)
- Link custody transfer to unload step (see APP-GAP-D)

### APP-GAP-D: Unload Step (Begin Unload)

**Manhattan:** Distinct step between ASN Verification and Scan Item. Forklift operator unloads pallets. Damage often discovered here.  
**Current State:** Completely missing.  
**Tasks to add:**
- Add `unload_status` field on goods_receipts (NOT_STARTED / IN_PROGRESS / COMPLETED)
- Add RF endpoint: `POST rf/inbound/receive/begin-unload` — start unloading phase
- Add RF endpoint: `POST rf/inbound/receive/end-unload` — complete unloading
- Record pallet count unloaded
- Allow damage reporting during unloading (before formal receiving)

### APP-GAP-E: Pallet-Level Receiving

**Manhattan:** 10 Pallets, each 100 units → scan pallet barcode, confirm quantity per pallet.  
**Current State:** Completely missing from plan.  
**Tasks to add:**
- Add `pallet_receiving_sessions` table (pallet_count, pallets_unloaded, status)
- Add RF endpoint: `POST rf/inbound/receive/scan-pallet` — scan pallet barcode during receiving
- Add RF endpoint: `POST rf/inbound/receive/confirm-pallet` — confirm pallet qty
- Create multiple LPNs in batch for multi-pallet trailers

### APP-GAP-F: LPN QC_HOLD and DAMAGED Statuses

**Manhattan**: LPN lifecycle includes optional QC_HOLD status for damaged items. Damage → QC_HOLD → QC → QC_PASS/FAIL.  
**Current State:** Damage disposition exists (HOLD/SCRAP/RETURN_TO_VENDOR) but no QC_HOLD LPN status, no DAMAGED LPN status.  
**Tasks to add:**
- Add `damage_records` table with damage_code, qty, operator_id, receiving_line_id
- On damage with `requires_qc=true`: set LPN status to QC_HOLD (not STAGED/PUTAWAY_PENDING)
- On damage without QC: set LPN status to DAMAGED
- Separate damage routing: QC_HOLD → quality inspection; DAMAGED → disposition workflow

### APP-GAP-G: Blind Receiving (No ASN/PO)

**Manhattan:** Receive without ASN → blind receiving with higher error rates.  
**Current State:** Existing `blindReceive` exists in service but workflow is incomplete.  
**Tasks to add:**
- Enhance blind receive to accept full product details (description, UOM) when no SKU match found
- Add "create product on the fly" capability for blind receiving
- Flag blind receipts for added verification/review

### APP-GAP-H: ASN Sync on Variance (Update ASN + Notify Purchasing)

**Manhattan:** On variance: record variance, update ASN, notify purchasing.  
**Current State:** Missing.  
**Tasks to add:**
- On under-receipt: decrement ASN line remaining qty / set PO line status to PARTIALLY_RECEIVED
- On over-receipt: increment ASN line received qty (optional, configurable)
- Emit event `receipt.variance.detected` for notification system (purchasing alert)
- Create `asn_line_variance_log` table for audit of ASN adjustments

### APP-GAP-I: Receiving Task Lifecycle (CREATED → IN_PROGRESS → COMPLETED)

**Manhattan:** Receiving is task-driven — operators get assigned tasks, not menu items.  
**Current State:** RF receiving is session-based (RfSessionGuard), not task-based.  
**Tasks to add:**
- Add `receiving_tasks` table with status lifecycle
- Method: `getNextReceivingTask(tenantId, facilityId, userId)` — auto-assign
- Method: `startReceivingTask(tenantId, taskId)` — status → IN_PROGRESS
- Method: `completeReceivingTask(tenantId, taskId)` — status → COMPLETED
- All RF receiving endpoints should operate within a task context

### APP-GAP-J: Unified Audit Trail

**Manhattan:** Every receipt records Trailer, ASN, Operator, LPN, Quantity, Timestamp, Dock Door, Variance, Damage Code.  
**Current State:** Data scattered across multiple tables. No unified audit view.  
**Tasks to add:**
- Create `receiving_audit_log` table with all Manhattan-specified fields
- Create `AuditService.receivingAudit()` helper to write audit entries
- Add audit log writes at every step: trailer check-in, dock assign, LPN create, qty confirm, stage, complete
- Provide web endpoint: GET `/web/audit/receiving/:receiptId` with full traceability
