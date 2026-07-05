# Inventory Cycle Count — RF Implementation Plan

**Reference:** Manhattan_RF_Operations_Suite_v1 Parts 1-2  
**Existing Code:** `src/inventory/counts/` — CycleCountRfController (6 endpoints), CycleCountService (10 methods)  
**Status:** 55% Complete — count creation, location scanning, quantity entry, and basic variance detection exist; missing auto-approval, recount generation, supervisor review, root cause, ABC scheduling, LPN counting mode, blind count toggle  

---

## Summary of Manhattan Process

```
Generate Count Task (ABC scheduled) → Get Count Work → Travel to Location
→ Scan Location → Blind Count Inventory → Enter Quantity → Submit Count
→ Variance Detection → [Variance ≤ threshold → Auto-Approve]
→ [Variance > threshold → Create Recount (different operator)]
→ [Variance approved → Inventory Adjustment] → Supervisor Review
→ Root Cause Analysis → Audit Trail
```

---

## GAP-1: Missing Auto-Approval for Small Variances

**Manhattan Reference:** Variance ≤ threshold → auto-approve (no human intervention)  
**Current State:** `submitLine` flags `requiresSupervisorApproval` when variance > 2x tolerance. `complete` creates `variance_investigations` for ALL variances > 5% but does NOT auto-approve small ones.  
**Impact:** Every variance creates an investigation, even trivially small ones (e.g., 1 unit difference on 1000). Overwhelms supervisors.

### Tasks

#### GAP-1.1: Create `approval_threshold_configs` Prisma model
- **File:** `prisma/schema.prisma`
- Fields: `config_id`, `tenant_id`, `facility_id`, `threshold_type` (PERCENTAGE/ABSOLUTE/VALUE), `auto_approve_pct`, `auto_approve_abs`, `auto_approve_value`, `supervisor_review_pct`, `recount_pct`

#### GAP-1.2: Create Approval Threshold Service
- **File:** `src/inventory/counts/approval-threshold.service.ts`
- Methods: `getThresholdForFacility`, `evaluateVariance` (returns AUTO_APPROVE | RECOUNT | SUPERVISOR_REVIEW)
- **File:** `src/inventory/counts/web/approval-threshold.controller.ts`
- Web: POST/GET/PATCH `/web/approval-thresholds[/:id]`

#### GAP-1.3: Integrate auto-approval into `submitLine` and `complete`
- **File:** `src/inventory/counts/cycle-count.service.ts`
- `submitLine`: after variance detected, evaluate against threshold config
  - AUTO_APPROVE → mark line as APPROVED, return `{ autoApproved: true }`
  - RECOUNT → flag for recount (see GAP-3)
  - SUPERVISOR_REVIEW → flag for supervisor
- `complete`: auto-approve all non-flagged lines; apply inventory adjustments for auto-approved lines

---

## GAP-2: Missing Inventory Adjustment on Approval

**Manhattan Reference:** When variance is approved → system inventory adjusted to match physical count  
**Current State:** `complete` creates `variance_investigations` but does NOT update `inventory_on_hand`. Inventory is never adjusted.  
**Impact:** Counts are performed but inventory remains incorrect. The entire purpose of cycle counting (correcting inventory) is not fulfilled.

### Tasks

#### GAP-2.1: Implement inventory adjustment in `complete`
- **File:** `src/inventory/counts/cycle-count.service.ts`
- For each approved/auto-approved count line:
  - Calculate adjustment = countedQty - systemQty
  - If non-zero: update `inventory_on_hand` (set `quantity_on_hand` to counted quantity)
  - Create `inventory_transactions` row: type=CYCLE_COUNT_ADJUSTMENT, previous_qty, new_qty, variance
  - Create `inventory_adjustments` row: link to cycle count line, record adjustment reason
- Only adjust lines that passed auto-approval or supervisor approval

#### GAP-2.2: Create `inventory_adjustments` Prisma model
- **File:** `prisma/schema.prisma`
- Fields: `adjustment_id`, `tenant_id`, `count_line_id`, `product_id`, `location_id`, `lpn_id`, `previous_quantity`, `new_quantity`, `variance`, `adjustment_type` (INCREASE/DECREASE/ZERO), `reason` (CYCLE_COUNT/CORRECTION/DAMAGE), `approved_by`, `created_at`

---

## GAP-3: Missing Recount Task Generation

**Manhattan Reference:** Large variance → automatically create recount task, assign to DIFFERENT operator (segregation of duties)  
**Current State:** `complete` creates `variance_investigations` with status OPEN. No recount task is generated.  
**Impact:** No structured recount workflow. Supervisors must manually decide and create recount tasks.

### Tasks

#### GAP-3.1: Implement recount generation in `submitLine` / `complete`
- **File:** `src/inventory/counts/cycle-count.service.ts`
- When variance triggers RECOUNT threshold:
  - Create a new `inventory_counts` record with:
    - `status = 'PENDING_RECOUNT'`
    - `parent_count_id = original count ID`
    - `count_type = 'RECOUNT'`
    - Same location and product as original line
  - Exclude original counter: `excluded_user_id = original counter`
  - Create `variance_investigations` record with status `RECOUNT_CREATED`

#### GAP-3.2: Update `nextTask` / RF `start` to handle recounts
- **File:** `src/inventory/counts/cycle-count.service.ts`
- Method: `getNextCountWork` should prioritize recounts but exclude original counter
- **File:** `src/inventory/rf/cycle-count.controller.ts`
- Update `start`: if recount, inform operator "RECOUNT: Location X-01-02-03"

#### GAP-3.3: Add recount comparison logic
- **File:** `src/inventory/counts/cycle-count.service.ts`
- When recount is submitted: compare original count qty vs recount qty
- If both agree → approve both and adjust inventory
- If they disagree → escalate to supervisor for triple-count or investigation

---

## GAP-4: Missing Supervisor Review Workflow

**Manhattan Reference:** Supervisor can approve, reject, request recount, or launch investigation  
**Current State:** `variance_investigations` are created but no endpoints exist for supervisor actions.  
**Impact:** Supervisors have no interface to review and resolve variances.

### Tasks

#### GAP-4.1: Supervisor review service methods
- **File:** `src/inventory/counts/cycle-count.service.ts`
- New methods:
  - `getPendingReviews(tenantId, facilityId)` — list all cycles with pending supervisor review
  - `approveVariance(tenantId, countLineId, supervisorId)` — approve and trigger inventory adjustment
  - `rejectVariance(tenantId, countLineId, supervisorId, reason)` — reject, keep system qty
  - `requestRecount(tenantId, countLineId, supervisorId)` — create new recount task
  - `launchInvestigation(tenantId, countLineId, supervisorId, reason)` — trigger root cause analysis

#### GAP-4.2: RF supervisor endpoints
- **File:** `src/inventory/rf/cycle-count.controller.ts`
- Route: `POST rf/cycle-counts/pending-reviews` — list pending
- Route: `POST rf/cycle-counts/:countId/approve` — approve count
- Route: `POST rf/cycle-counts/:countId/reject` — reject count
- Route: `POST rf/cycle-counts/:countId/recount` — request recount

#### GAP-4.3: Web supervisor endpoints
- **File:** `src/inventory/counts/web/cycle-count.controller.ts`
- Same endpoints for web supervisor interface

---

## GAP-5: Missing Root Cause Analysis

**Manhattan Reference:** Track root causes: Receiving Error, Picking Error, Damage, Theft, Misplaced Inventory  
**Current State:** No root cause categorization. Variance investigation is just an OPEN/CLOSED record.  
**Impact:** Cannot identify systemic problems. Same issue repeats across cycles.

### Tasks

#### GAP-5.1: Create `root_cause_categories` Prisma model
- **File:** `prisma/schema.prisma`
- Fields: `category_id`, `tenant_id`, `code`, `description`, `category_type` (RECEIVING_ERROR/PICKING_ERROR/DAMAGE/THEFT/MISPLACED_INVENTORY/SYSTEM_ERROR/OTHER), `is_active`

#### GAP-5.2: Add root cause to variance investigations
- **File:** `prisma/schema.prisma` — `variance_investigations`
- Add columns: `root_cause_category_id`, `root_cause_description`, `corrective_action`, `resolved_by`, `resolved_at`

#### GAP-5.3: Root cause service + endpoints
- **File:** `src/inventory/counts/root-cause.service.ts`
- Methods: CRUD for categories, `assignRootCause(tenantId, investigationId, categoryId, description)`
- Web: POST/GET `/web/root-cause-categories[/:id]`, POST `/web/variance-investigations/:id/assign-root-cause`
- RF: `POST rf/cycle-counts/:countId/root-cause` — assign root cause from RF

---

## GAP-6: Missing ABC Classification-Based Scheduling

**Manhattan Reference:** A-items counted weekly, B-items monthly, C-items quarterly  
**Current State:** No scheduling engine. Counts are created manually or ad-hoc.  
**Impact:** Cannot automate count schedule. High-value items may go months without counting.

### Tasks

#### GAP-6.1: Add ABC fields to products
- **File:** `prisma/schema.prisma` — `products`
- Add columns: `abc_class` (A/B/C), `last_counted_at`, `next_count_due_at`, `count_frequency_days`

#### GAP-6.2: Create Count Scheduler Service
- **File:** `src/inventory/counts/count-scheduler.service.ts`
- Method: `generateScheduledCounts(tenantId, facilityId)`
- Query products where `next_count_due_at <= now()`
- Group by location zone; create `inventory_counts` with status `PENDING`
- Set default ABC frequencies if not configured: A=7 days, B=30 days, C=90 days
- Create BullMQ job to run scheduler daily

#### GAP-6.3: Update products on cycle count completion
- **File:** `src/inventory/counts/cycle-count.service.ts`
- In `complete`: update product's `last_counted_at = now()`, `next_count_due_at = now() + count_frequency_days`

#### GAP-6.4: Create `count_scheduler_metrics` table
- **File:** `prisma/schema.prisma`
- Fields: `metric_id`, `schedule_run_at`, `facility_id`, `total_counts_created`, `a_items_created`, `b_items_created`, `c_items_created`, `errors_count`

---

## GAP-7: Missing LPN Counting Mode

**Manhattan Reference:** LPN Counting — scan an LPN, verify its contents. Faster than location counting for pallet-controlled warehouses.  
**Current State:** `verifyItemAtLocation` links LPNs to locations, `scanLocationForCount` lists LPNs at a location, but there's no standalone LPN counting mode.

### Tasks

#### GAP-7.1: Add LPN count mode
- **File:** `src/inventory/counts/cycle-count.service.ts`
- New method: `startLpnCount(tenantId, facilityId, lpnBarcode, userId)`
- Look up LPN; create count task specifically for this LPN
- Pull all products in LPN from `inventory_on_hand` where `lpn_id`
- Return products with expected quantities hidden (blind count)

#### GAP-7.2: Add RF LPN count endpoints
- **File:** `src/inventory/rf/cycle-count.controller.ts`
- Route: `POST rf/cycle-counts/start-lpn` — initiate LPN count
- Route: `POST rf/cycle-counts/scan-lpn-for-count` — scan LPN to verify (already partially covered by `scan-lpn`)

---

## GAP-8: Blind Count Toggle

**Manhattan Reference:** Blind Count — operator does NOT see expected quantity. Prevents operator bias.  
**Current State:** `scanLocationForCount` returns items "without system quantity" (blind by default). But there's no explicit toggle. No way to disable blind counting for specific counts.  
**Impact:** Cannot switch between blind and non-blind mode. Some warehouses may prefer non-blind for training.

### Tasks

#### GAP-8.1: Add `is_blind_count` to count creation
- **File:** `prisma/schema.prisma` — `inventory_counts`
- Add column: `is_blind_count` (boolean, default true)

#### GAP-8.2: Update `scanLocationForCount` for blind/non-blind
- **File:** `src/inventory/counts/cycle-count.service.ts`
- If `is_blind_count = false` → include `expectedQuantity` in response items
- If `is_blind_count = true` → hide expected quantity (current behavior)

---

## Summary: Files to Create/Update

### New Files
| # | File | Purpose |
|---|------|---------|
| 1 | `src/inventory/counts/approval-threshold.service.ts` | Threshold config CRUD + evaluation |
| 2 | `src/inventory/counts/web/approval-threshold.controller.ts` | Web threshold endpoints |
| 3 | `src/inventory/counts/web/cycle-count.controller.ts` | Web cycle count CRUD + supervisor review |
| 4 | `src/inventory/counts/root-cause.service.ts` | Root cause category CRUD + assignment |
| 5 | `src/inventory/counts/count-scheduler.service.ts` | ABC-based count scheduling |
| 6 | `src/inventory/counts/count-scheduler.processor.ts` | BullMQ scheduler consumer |

### New Prisma Tables
| # | Table | Purpose |
|---|-------|---------|
| 1 | `approval_threshold_configs` | Variance threshold rules |
| 2 | `inventory_adjustments` | Inventory quantity adjustments |
| 3 | `root_cause_categories` | Root cause enumeration |
| 4 | `count_scheduler_metrics` | Scheduling run history |

### Updated Prisma Tables
| # | Table | Changes |
|---|-------|---------|
| 1 | `inventory_counts` | Add is_blind_count, parent_count_id, count_type, excluded_user_id |
| 2 | `inventory_count_lines` | Add status (PENDING/APPROVED/RECOUNTING/REJECTED), approved_by, approved_at |
| 3 | `variance_investigations` | Add root_cause_category_id, root_cause_description, corrective_action, resolved_by, resolved_at |
| 4 | `products` | Add abc_class, last_counted_at, next_count_due_at, count_frequency_days |

### Updated Files
| # | File | Changes |
|---|------|---------|
| 1 | `src/inventory/counts/cycle-count.service.ts` | Add auto-approval, recount generation, inventory adjustment, supervisor review methods, LPN count mode, blind count toggle, root cause assignment |
| 2 | `src/inventory/rf/cycle-count.controller.ts` | Add 8 new RF endpoints (pending-reviews, approve/reject/recount, root-cause, start-lpn, scan-lpn-for-count); fix blind count toggle |
| 3 | `src/inventory/counts/counts.module.ts` | Register new services and controllers |
| 4 | `prisma/schema.prisma` | Add 4 tables, modify 4 tables |
| 5 | `src/common/casl/casl-ability.factory.ts` | Add CASL subjects: 'ApprovalThreshold', 'InventoryAdjustment', 'RootCauseCategory' |

### RF Endpoints Added
| Route | Action | Purpose |
|-------|--------|---------|
| `POST rf/cycle-counts/pending-reviews` | read | List counts needing supervisor review |
| `POST rf/cycle-counts/:id/approve` | update | Supervisor approve count |
| `POST rf/cycle-counts/:id/reject` | update | Supervisor reject count |
| `POST rf/cycle-counts/:id/recount` | update | Request recount |
| `POST rf/cycle-counts/:id/root-cause` | update | Assign root cause to variance |
| `POST rf/cycle-counts/start-lpn` | create | Initiate LPN-based count |
| `POST rf/cycle-counts/scan-lpn-for-count` | read | Scan LPN for count verification |

### Web Endpoints Added
| Route | Method | Purpose |
|-------|--------|---------|
| `/web/approval-thresholds[/:id]` | POST/GET/PATCH | Threshold config CRUD |
| `/web/cycle-counts[/:id]` | POST/GET/PATCH | Count CRUD |
| `/web/cycle-counts/:id/approve` | POST | Web supervisor approve |
| `/web/cycle-counts/:id/reject` | POST | Web supervisor reject |
| `/web/root-cause-categories[/:id]` | POST/GET/PATCH | Root cause CRUD |
| `/web/variance-investigations/:id/assign-root-cause` | POST | Assign root cause |
| `/web/inventory-adjustments` | GET | View adjustment history |

### BullMQ Jobs Added
| Queue | Job | Schedule |
|-------|-----|----------|
| `count-scheduler` | `generateScheduledCounts` | Daily at 6 AM (configurable) |

---

## Priority & Effort

| Priority | Item | Effort |
|----------|------|--------|
| CRITICAL | GAP-2: Inventory adjustment implementation | Large |
| HIGH | GAP-1: Auto-approval thresholds | Medium |
| HIGH | GAP-3: Recount task generation | Medium |
| HIGH | GAP-4: Supervisor review workflow | Medium |
| MEDIUM | GAP-6: ABC scheduling | Large |
| MEDIUM | GAP-5: Root cause analysis | Small |
| LOW | GAP-7: LPN counting mode | Small |
| LOW | GAP-8: Blind count toggle | Trivial |

---

## APPENDIX: Post-Verification Critical Missing Items

### APP-CC-A: Complete State Machine Implementation (Missing States)

**Manhattan:** CREATED → READY → ASSIGNED → COUNTED → APPROVED → CLOSED  
**Current State:** Plan uses PENDING (ambiguous — skips CREATED/READY/COUNTED/CLOSED). No state transition guards. No operator assignment tracking.  
**Tasks to add:**
- Add explicit status values: CREATED (scheduler generated), READY (available for assignment), ASSIGNED (operator claimed), COUNTED (qty submitted, awaiting analysis), APPROVED (variance resolved), CLOSED (adjustment applied, finalized)
- Count scheduler creates with CREATED status, then transitions to READY
- `getNextCountWork` sets ASSIGNED + `assigned_to_user_id` + `assigned_at`
- `submitLine` sets line status to COUNTED
- `approveVariance` / auto-approve sets APPROVED
- After inventory adjustment applied → CLOSED
- Add state transition guard: only allow transitions following the defined flow

### APP-CC-B: Location Scan Validation & Rejection

**Manhattan:** If operator scans wrong location (e.g., B-02 instead of expected A-01-01-01), system must REJECT and display "WRONG LOCATION" error.  
**Current State:** `scanLocationForCount` returns location data but does NOT validate against expected location. No expected location is tracked in the count session.  
**Tasks to add:**
- On `complete` / RF `start`: store expected location ID on the count or count line
- In `scan-location` RF endpoint: compare scanned location against expected location
- If mismatch: return error `{ valid: false, message: "WRONG LOCATION — Expected: A-01-01-01" }`
- Option: supervisor override with PIN for emergency location overrides

### APP-CC-C: Repeated Variance Detection

**Manhattan:** Same location/product with multiple variances across counts → triggers investigation. Supervisor review required for repeated issues.  
**Current State:** No `variance_count` or repeat-detection logic.  
**Tasks to add:**
- Add `variance_history_count` to inventory_on_hand or storage_locations
- After each completed count with variance > 0: increment variance_history_count
- If variance_history_count >= 3 (configurable) → auto-escalate to supervisor + flag as "REPEAT VARIANCE"
- Add `is_repeat_variance` boolean to inventory_count_lines

### APP-CC-D: Sensitive Inventory Concept

**Manhattan:** "Sensitive inventory" (high-value, controlled substances, etc.) triggers mandatory supervisor review regardless of variance size.  
**Current State:** Plan has no concept of sensitive inventory. No special routing.  
**Tasks to add:**
- Add `is_sensitive` flag to `products` table
- Add `sensitivity_level` (NORMAL / HIGH / CRITICAL) to products
- For sensitive products: any variance > 0 → supervisor review (bypass auto-approval)
- For controlled substances: variance = 0 required, else investigation + regulatory notification

### APP-CC-E: Dedicated Immutable Audit Trail

**Manhattan Best Practice #6:** "Maintain complete audit history." Every count, adjustment, approval must be immutable and traceable.  
**Current State:** No dedicated audit log table. Data stored in mutable records. No event sourcing.  
**Tasks to add:**
- Create `cycle_count_events` table (append-only — no UPDATE, no DELETE via application layer)
- Write events: COUNT_CREATED, COUNT_ASSIGNED, LOCATION_SCANNED, QUANTITY_SUBMITTED, VARIANCE_DETECTED, AUTO_APPROVED, RECOUNT_CREATED, SUPERVISOR_APPROVED, SUPERVISOR_REJECTED, ADJUSTMENT_APPLIED, COUNT_CLOSED
- Include snapshot of relevant data at each event (immutable historical record)
- Web endpoint: GET `/web/audit/cycle-count/:countId/timeline`

### APP-CC-F: Operator Assignment Collision Prevention

**Manhattan:** Two operators must not claim the same count work.  
**Current State:** `getNextCountWork` returns a count but there's no locking mechanism to prevent double-assignment.  
**Tasks to add:**
- Optimistic locking: use `updated_at` or `version` column
- On assignment: `updateMany WHERE status=READY AND version=? SET status=ASSIGNED, assigned_to=?, version+1`
- If updateMany returns count=0 → another operator claimed it first → retry with next
- Alternative: use DB-level advisory lock or SELECT FOR UPDATE

### APP-CC-G: Count Interruption / Resume (Draft Mode)

**Manhattan:** Operator may need to pause mid-count (shift change, break, emergency).  
**Current State:** No save-draft mechanism. Count jumps from ASSIGNED to COUNTED (submitLine). No save-progress capability.  
**Tasks to add:**
- Allow `submitLine` to save partial results per product (draft = true)
- Track which items at a location have been counted and which haven't
- Add `count_progress` table or field on count_lines: `draft_quantity`, `is_final`
- Method: `saveDraftLine(countId, productId, draftQty)` — saves current progress
- Method: `getCountProgress(countId)` — returns list of counted + unaccounted items at location
- Timeout: if count IN_PROGRESS and no updates for 2 hours → auto-unassign

### APP-CC-H: Zero-Count / Empty Location Handling

**Manhattan:** Operator sent to count location where system says inventory exists, but location is empty. Count = 0, variance = full expected qty.  
**Current State:** Plan allows qty=0 but no special handling for the "expected > 0, counted = 0" edge case.  
**Tasks to add:**
- For count qty = 0 with expected qty > 0: require operator confirmation ("Confirm: Location is empty?")  
- Flag as `EMPTY_LOCATION_CONFIRMED` — different from normal variance
- Auto-create investigation for empty-location variance (potential theft/misplacement)
- Prompt operator: "Check adjacent locations" guidance on RF

### APP-CC-I: Triple-Count Model (Original vs Recount Disagreement)

**Manhattan:** When original count and recount disagree (e.g., Original=95, Recount=105) → escalate for triple-count with a THIRD operator.  
**Current State:** GAP-3.3 mentions "escalate to supervisor for triple-count or investigation" but provides NO model, logic, or handling for the third count.  
**Tasks to add:**
- Add `count_round` to inventory_count_lines (1=original, 2=recount, 3=triple-count)
- After recount submitted → compare original vs recount
- If both agree (within narrow tolerance, e.g., ±1): auto-approve using whichever count
- If disagree → create new count with `count_round=3`, flag as TRIPLE_COUNT_REQUIRED
- Triple count assigned to yet another operator (exclude original + recount operators)
- After triple count: majority rule (2 of 3 agree) or escalate to physical audit

### APP-CC-J: Dynamic ABC Reclassification

**Manhattan:** Product velocity changes over time. A product may move from A→B→C based on actual movement.  
**Current State:** `abc_class` is a static label. No reclassification job. No periodic recalculation.  
**Tasks to add:**
- Create BullMQ job: `abc-reclassification` — runs weekly
- Calculate ABC based on: movement quantity (last 90 days), movement frequency, value (qty × unit_price)
- Update product `abc_class` and `count_frequency_days` based on new class
- Log reclassification changes to `abc_reclassification_log` table
- Web: GET `/web/products/:id/abc-history` for audit

### APP-CC-K: Ad-Hoc / Event-Triggered Count Creation

**Manhattan:** Counts can be created manually (supervisor), or triggered by events (damage report, pick discrepancy, customer complaint).  
**Current State:** Only scheduled counts (GAP-6) and recount counts (GAP-3) are defined. No ad-hoc or event-triggered creation.  
**Tasks to add:**
- Web endpoint: `POST /web/cycle-counts/create-ad-hoc` with location, LPN, or product scope
- RF endpoint: `POST rf/cycle-counts/create-ad-hoc` for supervisor-initiated spot counts
- Integration hooks: pick discrepancy → auto-create count; damage report → auto-create count; transfer discrepancy → auto-create count
