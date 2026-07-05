# Inbound Putaway — RF Implementation Plan

**Reference:** Manhattan_RF_Operations_Suite_v1 Parts 1-2  
**Existing Code:** `src/inbound/putaway/` — RfPutawayController (8 endpoints), PutawayService (12 methods)  
**Status:** 75% Complete — core putaway workflow is solid; missing location-full handling, damage-during-movement, hazmat validation, capacity enforcement, task interleaving, overflow strategy  

---

## Summary of Manhattan Process

```
Receiving Complete → Putaway Task Created → Get Work → Scan LPN
→ Receive Destination Location (system-directed) → Travel → Scan Destination → Confirm Putaway
→ [Location Full → Find Alternate] [Damage → Reroute to QC]
→ LPN: STORED | Task: COMPLETED
```

---

## GAP-1: Missing "Location Full" Exception Handling

**Manhattan Reference:** Operator arrives at directed location, finds it full → selects "Location Full" on RF → system assigns alternate location  
**Current State:** `completeTask` accepts override for wrong location but has no "Location Full" button/flag. Operator can only override with a reason code.  
**Impact:** Operator must manually scan a different location and provide override reason. No automated alternate location finding. Workflow is manual/error-prone.

### Tasks

#### GAP-1.1: Add `locationFullException` method to PutawayService
- **File:** `src/inbound/putaway/putaway.service.ts`
- New method: `locationFullException(tenantId, taskId, userId)`
- Mark current suggested location as full (add to `location_exceptions` or decrement capacity)
- Call `suggestLocation()` to find next best alternate (passing exclusion: blocked location)
- Update task with alternate location; return new suggested location

#### GAP-1.2: Add RF endpoint for Location Full
- **File:** `src/inbound/putaway/rf/putaway.controller.ts`
- Route: `POST rf/inbound/putaway/location-full` — operator flags location as full, system returns alternate

#### GAP-1.3: Create `location_exceptions` table
- **File:** `prisma/schema.prisma`
- Fields: `exception_id`, `tenant_id`, `location_id`, `exception_type` (FULL/DAMAGED/BLOCKED), `reported_by`, `reported_at`, `resolved_at`

---

## GAP-2: Missing "Damaged During Movement" Handling

**Manhattan Reference:** If inventory damaged while transporting to destination, operator records damage code → inventory routed to HOLD/QC  
**Current State:** No damage handling during putaway. `completeTask` has no damage code or rerouting logic.  
**Impact:** Damaged inventory is stored in regular locations. No audit trail for damage during movement.

### Tasks

#### GAP-2.1: Add damage handling to `completeTask`
- **File:** `src/inbound/putaway/putaway.service.ts`
- Accept `damageCodeId` and `damageQuantity` in DTO
- If damaged: reroute damaged quantity to QC_HOLD location (not the original destination)
- Create damage record; update LPN status to QC_HOLD for damaged portion
- Create inventory transaction: type=DAMAGE_MOVEMENT

#### GAP-2.2: Add RF damage endpoint
- **File:** `src/inbound/putaway/rf/putaway.controller.ts`
- Route: `POST rf/inbound/putaway/report-damage` — record damage during putaway movement

---

## GAP-3: Missing Capacity & Hazmat Validation

**Manhattan Reference:** Location must have adequate weight/volume capacity. Hazmat class must match product class. Customer commingling prohibited.  
**Current State:** `suggestLocation` checks `inventory_on_hand` aggregate against `max_weight` but does NOT check `max_volume`, hazmat class matching, or customer ownership commingling. `validateLocation` only checks location existence.  
**Impact:** Can suggest locations that violate hazmat segregation or exceed volume capacity.

### Tasks

#### GAP-3.1: Add volume capacity check
- **File:** `src/inbound/putaway/putaway.service.ts` — `suggestLocation()`
- Query product volume (from `products.volume_per_unit` or `weight_volume` table)
- Calculate `currentVolume` from existing inventory at location
- Compare `currentVolume + incomingVolume <= maxVolume`
- Reject locations exceeding volume capacity

#### GAP-3.2: Add hazmat validation
- **File:** `src/inbound/putaway/putaway.service.ts`
- Query product hazmat class from `products`
- Query location hazmat allowed classes from `storage_locations` (add `hazmat_class` field if missing)
- Reject locations with incompatible hazmat class
- **File:** `prisma/schema.prisma` — add `hazmat_class`, `allowed_hazmat_classes` to `storage_locations`

#### GAP-3.3: Add customer commingling check
- **File:** `src/inbound/putaway/putaway.service.ts`
- Query product's customer ownership
- Query existing inventory at location for different customer ownership
- If product requires dedicated storage (config flag), reject mixed-owner locations

#### GAP-3.4: Update `validateLocation` to check capacity/hazmat
- **File:** `src/inbound/putaway/putaway.service.ts` — `validateLocation()`
- Add capacity, hazmat, commingling checks to location validation
- Return structured validation result with specific failure reasons

---

## GAP-4: Missing Overflow Location Strategy

**Manhattan Reference:** When primary/preferred location is full → system assigns overflow location. Prevents receiving from stopping.  
**Current State:** `suggestLocation` has hierarchical rules but stops at the first available location. No concept of primary vs overflow location tiers.  
**Impact:** When preferred location fills, putaway may find a lower-priority location, but no explicit "this is an overflow" designation.

### Tasks

#### GAP-4.1: Add overflow tier to putaway rules
- **File:** `prisma/schema.prisma` — `putaway_rules`
- Add columns: `is_overflow_rule` (boolean), `parent_rule_id` (nullable FK to self)
- When primary rule finds no capacity → fall back to linked overflow rule

#### GAP-4.2: Update `suggestLocation` for overflow
- **File:** `src/inbound/putaway/putaway.service.ts`
- Return `locationTier: 'PRIMARY' | 'OVERFLOW'` in suggestion result
- RF displays "OVERFLOW: A-05-01-01" to inform operator

---

## GAP-5: Missing Task Interleaving

**Manhattan Reference:** After putaway complete, system may assign a different task type (Cycle Count, Replenishment) based on proximity to reduce empty travel  
**Current State:** No cross-workflow task interleaving. Each workflow operates independently.  
**Impact:** Forklift operators travel empty between tasks, wasting 20-40% of shift time.

### Tasks

#### GAP-5.1: Create Task Interleaving Service
- **File:** `src/common/task-interleaving/task-interleaving.service.ts`
- Method: `getNextInterleavedTask(tenantId, facilityId, userId, currentLocationId, equipmentType)`
- Query all available tasks across workflows (Putaway, Replenishment, Cycle Count, Transfer)
- Sort by proximity to `currentLocationId`
- Return highest-priority, nearest task of any type

#### GAP-5.2: Add interleaving endpoint
- **File:** `src/inbound/putaway/rf/putaway.controller.ts`
- Route: `POST rf/inbound/putaway/next-interleaved-task` — after putaway complete, get next work (any type)

#### GAP-5.3: Prerequisites
- Requires Cycle Count, Replenishment, Transfer services to expose "next available task" methods

---

## GAP-6: Minor RF Action Type Corrections

**Current State:** `next-task`, `scan-lpn`, `scan-location`, `suggest-location` use `@RfAction('read')`.  
**Manhattan Convention:** Scanning/searching is 'read', but `next-task` (which assigns work) should be 'update'.

### Tasks

#### GAP-6.1: Correct RF action types
- **File:** `src/inbound/putaway/rf/putaway.controller.ts`
- `nextTask`: change from 'read' to 'update' (workflow assignment)
- `start`: already 'update' (correct)
- `assign`: already 'update' (correct)
- `scanLpn`, `scanLocation`, `suggestLocation`: keep as 'read' (correct)

---

## Summary: Files to Create/Update

### New Files
| # | File | Purpose |
|---|------|---------|
| 1 | `src/common/task-interleaving/task-interleaving.service.ts` | Cross-workflow task interleaving engine |
| 2 | `src/common/task-interleaving/task-interleaving.module.ts` | NestJS module |

### New Prisma Tables
| # | Table | Purpose |
|---|-------|---------|
| 1 | `location_exceptions` | Track full/damaged/blocked location exceptions |
| 2 | `putaway_damage_records` | Damage during putaway movement audit |

### Updated Prisma Tables
| # | Table | Changes |
|---|-------|---------|
| 1 | `storage_locations` | Add `allowed_hazmat_classes`, `max_volume` columns |
| 2 | `putaway_rules` | Add `is_overflow_rule`, `parent_rule_id` columns |

### Updated Files
| # | File | Changes |
|---|------|---------|
| 1 | `src/inbound/putaway/putaway.service.ts` | Add locationFull handling, damage handling, capacity/hazmat/commingling validation, overflow tier logic, task interleaving |
| 2 | `src/inbound/putaway/rf/putaway.controller.ts` | Add 3 new RF endpoints: location-full, report-damage, next-interleaved-task; fix RF action types |
| 3 | `src/inbound/putaway/putaway.module.ts` | Register new dependencies |
| 4 | `prisma/schema.prisma` | Add 2 new tables, modify 2 existing |

### RF Endpoints Added
| Route | Action | Purpose |
|-------|--------|---------|
| `POST rf/inbound/putaway/location-full` | update | Flag location full, get alternate |
| `POST rf/inbound/putaway/report-damage` | update | Record damage during putaway |
| `POST rf/inbound/putaway/next-interleaved-task` | read | Get next task of any type (cross-workflow) |

### Web Updates
- `POST/GET /web/location-exceptions[/:id]` — view/manage location exceptions

---

## Priority & Effort

| Priority | Item | Effort |
|----------|------|--------|
| HIGH | GAP-3: Capacity + hazmat + commingling validation | Medium |
| MEDIUM | GAP-1: Location Full exception handling | Small |
| MEDIUM | GAP-4: Overflow location strategy | Medium |
| MEDIUM | GAP-2: Damage during movement handling | Small |
| LOW | GAP-5: Task interleaving | Large (cross-module dependency) |
| LOW | GAP-6: RF action type corrections | Trivial |

---

## APPENDIX: Post-Verification Critical Missing Items

### APP-PUT-A: LPN Existence & Status Validation in `findTaskByLpn`

**Manhattan:** Scan LPN → validate: LPN exists in LPN master AND LPN status = PUTAWAY_PENDING.  
**Current State:** `findTaskByLpn()` only searches `putaway_tasks` table by `lpn_barcode`. Does NOT check if LPN actually exists in `license_plate_numbers`. Does NOT check LPN status. When task not found, falls back to `suggested_location_barcode` (wrong fallback — that's a location barcode, not an LPN).  
**Tasks to add:**
- First query `license_plate_numbers` by `lpn_number === barcode`
- Validate: LPN exists, LPN status === PUTAWAY_PENDING
- Only then search `putaway_tasks` by `lpn_barcode`
- Remove fallback to `suggested_location_barcode` (location barcodes should not match LPN scan)

### APP-PUT-B: Weight Calculation Bug (Quantity vs. Weight)

**Manhattan:** Validate weight capacity by comparing `sum(product.weight × qty)` to `max_weight`.  
**Current State:** `suggestLocation()` compares `quantity_on_hand` (units) directly against `max_weight` (kg). This is a unit-conflation bug — 100 units of books (50g each = 5kg) vs 100 units of bricks (2kg each = 200kg) are treated as equal.  
**Tasks to add:**
- In `suggestLocation()`: fetch all `inventory_on_hand` at candidate location with their `product_id`
- Fetch product weights from `products` table
- Calculate: `totalWeight = sum(product.weight × inventory_on_hand.quantity_on_hand)`
- Compare TOTAL WEIGHT against `max_weight`, not quantity against weight
- Need `products.weight` field in schema (verify existence)

### APP-PUT-C: Velocity-Based Slotting (Unused Fields)

**Manhattan:** Fast-movers near shipping (forward pick), slow-movers to reserve (deeper). Uses ABC/velocity data.  
**Current State:** `putaway_rules` has `velocity_class_filter` and `prefer_pick_face_for_fast_movers` fields. But `suggestLocation()` NEVER reads either field. Velocity data exists in product tables but is NEVER queried during location suggestion.  
**Tasks to add:**
- In `suggestLocation()`: read product's ABC class or velocity classification
- Apply `velocity_class_filter` to match only rules relevant to this SKU's velocity
- Apply `prefer_pick_face_for_fast_movers`: for A-class items, prioritize forward-pick locations
- Sort slow-movers (C-class) to reserve/deep storage by zone distance from pick face

### APP-PUT-D: Forward Pick vs Reserve Location Separation

**Manhattan:** Separate reserve storage (bulk, high-bay, away from picking) from forward pick (ground-level, fast access).  
**Current State:** `location_type` field exists but `suggestLocation()` treats all active non-blocked locations equally. No forward-pick preference for fast-movers, no reserve-preference for bulk.  
**Tasks to add:**
- Add `location_type_preference` to putaway rules (enum: PREFER_FORWARD_PICK / PREFER_RESERVE / ANY)
- In `suggestLocation()`: when `prefer_pick_face_for_fast_movers` is true and product is A-class → restrict candidates to FORWARD_PICK locations
- When product is C-class or bulk → prefer RESERVE locations

### APP-PUT-E: Putaway Task Lifecycle — Missing CREATED/READY States

**Manhattan:** Task states: CREATED → READY → ASSIGNED → IN_PROGRESS → COMPLETED.  
**Current State:** `task_status_old` enum has PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED, ON_HOLD. Missing CREATED and READY. `createTask()` sets PENDING directly (skips CREATED→READY).  
**Tasks to add:**
- Add CREATED and READY to task_status_old enum
- `createTask()` creates with status CREATED
- Add method: `releaseTask(tenantId, taskId)` — CREATED → READY (available for assignment)
- `nextTask()` searches READY (not PENDING)
- Update all status references throughout the service

### APP-PUT-F: Equipment Type Filtering in Task Assignment

**Manhattan:** System optimizes for equipment usage. Forklift tasks vs pedestrian tasks. Not all operators have all equipment.  
**Current State:** No equipment type concept in putaway. `nextTask()` doesn't consider equipment.  
**Tasks to add:**
- Add `required_equipment_type` to `putaway_tasks` (FORKLIFT / REACH_TRUCK / PALLET_JACK / PEDESTRIAN)
- In `nextTask()`: accept `equipmentType` parameter, filter tasks by compatible equipment
- In RF `next-task` endpoint: extract equipment type from RF session or request body

### APP-PUT-G: Fixed Location Reservation

**Manhattan:** A fixed/home location that is currently empty should still be RESERVED for its assigned SKU. Other SKUs should not be directed there.  
**Current State:** `suggestLocation()` finds fixed_location_code matching rules, but if location is empty, it's treated as any other available location. No reservation concept.  
**Tasks to add:**
- Add `is_fixed_reserved` flag to `storage_locations`
- When a location has a fixed assignment rule with a product: mark `is_fixed_reserved = true`
- In `suggestLocation()`: skip `is_fixed_reserved = true` locations unless the product matches the assigned product
- Web endpoint: POST `/web/locations/:id/reserve-for-product` to manage reservations

### APP-PUT-H: Location Scan-Time Rejection (Not at Complete Time)

**Manhattan:** "RF Rejects Transaction" at the SCAN step if wrong location scanned. Not later at confirm time.  
**Current State:** `validateLocation()` returns valid/invalid but doesn't block. `completeTask()` rejects only if `actualLocationBarcode` is passed without override. If RF client skips sending `actualLocationBarcode`, wrong-location putaway silently succeeds.  
**Tasks to add:**
- In `validateLocation()` RF endpoint: return error response (throw ForbiddenException) when mismatch detected — not just a JSON flag
- Force `actualLocationBarcode` to always be sent in `confirm` / `completeTask` DTO (make it required)
- Remove the fallthrough where missing `actualLocationBarcode` skips validation

### APP-PUT-I: Proximity to Outbound/Shipping Zones

**Manhattan:** Fast-moving items should be stored near shipping/packing areas to minimize future pick travel.  
**Current State:** `sortByProximity()` only sorts by same-zone-as-staging. No proximity to outbound/shipping zones.  
**Tasks to add:**
- Add `zone_type` to storage zones (STAGING / PICK / RESERVE / SHIPPING / QUARANTINE)
- In `sortByProximity()`: also prioritize locations near SHIPPING zone for fast-movers
- For slow-movers: prioritize proximity to RESERVE zone
- This requires zone adjacency/matrix or distance data

### APP-PUT-J: Auto-Create Putaway Tasks from Receiving Completion

**Manhattan:** When receiving completes, putaway tasks should be auto-created. LPN transitions to PUTAWAY_PENDING → putaway task generated.  
**Current State:** `ReceivingService.completeReceipt` generates putaway tasks but the plan's LPN lifecycle integration is unclear.  
**Tasks to add:**
- Verify `ReceivingService.completeReceipt` calls `PutawayService.createTask` for each receipt line
- Ensure LPN status is set to PUTAWAY_PENDING before putaway task is created
- Add integration test for receiving→putaway handoff
