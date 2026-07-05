# Outbound Picking (Wave Picking) — RF Implementation Plan

**Reference:** Manhattan_RF_Operations_Suite_v1 Parts 1-4  
**Existing Code:** `src/outbound/picking-tasks/` — RfPickingController (10 endpoints), PickingTaskService (16 methods)  
**Status:** 65% Complete — pick-to-tote flow is solid; missing cluster picking, batch picking, case picking, wave-level operations, route optimization, pick carts, task interleaving, allocation validation  

---

## Summary of Manhattan Process

```
Wave Created (group orders) → Allocation (reserve inventory) → Generate Pick Tasks
→ Pick Strategies: [Pick-to-Tote | Cluster Picking | Batch Picking | Case Picking | Full Pallet]
→ Get Work → Scan Tote(s) → Travel (route-optimized) → Scan Location → Pick
→ [Cluster: Distribute to totes] → Confirm → Short Pick? → Next Location
→ Wave Completion Check → Inventory to Packing
```

---

## GAP-1: Missing Cluster Picking Support

**Manhattan Reference:** One visit to location, pick total quantity, distribute across multiple totes on cart  
**Current State:** `scanTote` supports single tote. `confirmPick` records single tote as destination. No way to distribute one pick across multiple totes.  
**Impact:** Cannot use cluster picking (the most efficient strategy for eCommerce). Pickers make separate trips for each tote.

### Tasks

#### GAP-1.1: Create `pick_carts` Prisma model
- **File:** `prisma/schema.prisma`
- Fields: `cart_id`, `tenant_id`, `facility_id`, `cart_code`, `cart_type` (CLUSTER/BATCH), `num_shelves` (typically 3-6), `is_active`

#### GAP-1.2: Create `pick_cart_assignments` Prisma model
- **File:** `prisma/schema.prisma`
- Fields: `assignment_id`, `cart_id`, `shelf_position` (TOP/MIDDLE/BOTTOM), `tote_id` or `lpn_id`, `assignment_order`, `pick_session_id`

#### GAP-1.3: Add cluster pick methods to PickingTaskService
- **File:** `src/outbound/picking-tasks/picking-task.service.ts`
- New methods:
  - `setupClusterPick(tenantId, userId, cartId, toteBarcodes[])` — assign cart, associate totes to shelves, create cluster pick session
  - `getClusterPickTasks(tenantId, sessionId)` — get all tasks for assigned totes, with route optimization by location
  - `distributePick(tenantId, taskId, distribution: [{ toteBarcode, quantity }])` — after picking total qty, distribute to each tote
  - `validateClusterDistribution(totalPickedQty, distributions[])` — sum of put qties must equal pick qty

#### GAP-1.4: Add RF cluster pick endpoints
- **File:** `src/outbound/picking-tasks/rf/picking.controller.ts`
- Route: `POST rf/outbound/pick/setup-cluster` — scan cart, scan totes, create cluster session
- Route: `POST rf/outbound/pick/cluster-next` — get next pick for cluster session (route optimized)
- Route: `POST rf/outbound/pick/distribute` — confirm pick and distribute to totes
- Route: `POST rf/outbound/pick/cluster-complete` — complete cluster session

---

## GAP-2: Missing Batch Picking Support

**Manhattan Reference:** Gather bulk inventory first (e.g., 50 Shirts), sort into individual orders later at packing/sortation stations  
**Current State:** No batch picking concept. All picks are associated to a single order/line.  
**Impact:** Cannot handle very high order volumes efficiently. Must pick each order individually.

### Tasks

#### GAP-2.1: Create batch pick session logic
- **File:** `src/outbound/picking-tasks/picking-task.service.ts`
- New method: `createBatchPick(tenantId, waveId, facilityId)`
  - Create a batch pick session that groups tasks by SKU across multiple orders
  - Generate "batch pick tasks" — bulk pick X qty of SKU-A, SKU-B (not per-order)
  - After bulk picks complete → generate sortation work at packing station

#### GAP-2.2: Create `pick_batch_sessions` Prisma model
- **File:** `prisma/schema.prisma`
- Fields: `batch_id`, `wave_id`, `status` (CREATED/PICKING/BULK_COMPLETE/SORTING/COMPLETED), `created_at`

#### GAP-2.3: RF Batch pick endpoints
- **File:** `src/outbound/picking-tasks/rf/picking.controller.ts`
- Route: `POST rf/outbound/pick/batch-start` — start batch pick session
- Route: `POST rf/outbound/pick/bulk-confirm` — confirm bulk pick (SKU + qty, no order context)
- Route: `POST rf/outbound/pick/batch-complete` — complete bulk phase, trigger sortation

---

## GAP-3: Missing Case Pick Handling

**Manhattan Reference:** Pick at case level (e.g., case = 12 units). Order needs 24 → picker selects 2 cases.  
**Current State:** `confirmPick` operates on eaches. No UOM/case-level picking differentiation.  
**Impact:** Picker must count individual eaches when cases suffice. Slower picking for case-pickable orders.

### Tasks

#### GAP-3.1: Add case pick support to confirmPick
- **File:** `src/outbound/picking-tasks/picking-task.service.ts`
- Accept `uomId` and `pickType` (EACH/CASE/PALLET) in confirm DTO
- If CASE: compute each quantity from case qty × product's `eaches_per_case`
- If PALLET: compute from product's `eaches_per_pallet` or `cases_per_pallet`
- Display case/pallet counts on RF screen (not each counts)

#### GAP-3.2: Add product packing hierarchy
- **File:** `prisma/schema.prisma` — `products`
- Add/modify columns: `eaches_per_case`, `cases_per_pallet`, `preferred_pick_uom` (EACH/CASE/PALLET)

#### GAP-3.3: RF case pick display
- **File:** `src/outbound/picking-tasks/rf/picking.controller.ts`
- When `next-task` returns a task, include `pickType`, `requestedCases`, `requestedEaches`

---

## GAP-4: Missing Wave-Level Operations

**Manhattan Reference:** Wave completion logic — wave is complete only when ALL required work is resolved (no outstanding short picks or pending replenishments)  
**Current State:** No wave operations. `nextTask` finds individual tasks. No wave status management. No wave completion check.  
**Impact:** Cannot track wave progress. Cannot enforce "all picks done before wave close". Cannot report wave-level metrics.

### Tasks

#### GAP-4.1: Create `picking_waves` Prisma model
- **File:** `prisma/schema.prisma`
- Fields: `wave_id`, `tenant_id`, `wave_number`, `facility_id`, `wave_type` (STANDARD/URGENT/RESHIP), `status` (CREATED/ALLOCATED/IN_PROGRESS/PARTIALLY_COMPLETE/COMPLETE/CLOSED), `total_tasks`, `completed_tasks`, `short_picks`, `created_at`, `completed_at`

#### GAP-4.2: Create Wave Service
- **File:** `src/outbound/waves/wave.service.ts`
- Methods:
  - `createWave` — group orders, allocate inventory, generate pick tasks
  - `getWaveStatus` — progress (completed/total tasks, shorts, replenishments)
  - `checkWaveCompletion` — evaluate if all tasks resolved
  - `closeWave` — finalize wave, transition to packing stage

#### GAP-4.3: Integrate wave into existing picking workflow
- **File:** `src/outbound/picking-tasks/picking-task.service.ts`
- In `confirmPick` and `shortPick`: after task update, call `checkWaveCompletion` to update wave status
- In `checkOrderPickedStatus`: after order marked PICKED, update wave stats

#### GAP-4.4: Web Wave endpoints
- **File:** `src/outbound/waves/web/wave.controller.ts`
- Web: POST/GET/PATCH `/web/waves[/:id]`, GET `/web/waves/:id/status`, POST `/web/waves/:id/close`, GET `/web/waves/:id/tasks`

#### GAP-4.5: RF Wave endpoints
- **File:** `src/outbound/picking-tasks/rf/picking.controller.ts`
- Route: `POST rf/outbound/pick/wave-status` — view current wave progress

---

## GAP-5: Missing Route Optimization (Pick Sequencing)

**Manhattan Reference:** System sequences pick locations to minimize travel (Aisle 1→2→3→4, not 1→10→2→9). Picker walks 10-20 KM per shift.  
**Current State:** `nextTask` returns highest-priority task but doesn't optimize by location proximity. No route sequencing.  
**Impact:** Inefficient travel — pickers crisscross the warehouse wasting time and energy.

### Tasks

#### GAP-5.1: Create route optimization logic
- **File:** `src/outbound/picking-tasks/pick-route.service.ts`
- Method: `optimizePickRoute(tenantId, tasks[])` 
  - For each task, look up its `from_location_id`
  - Query `storage_locations` for zone, aisle, bay, level coordinates
  - Apply nearest-neighbor algorithm: start from current location, pick nearest next location
  - Return ordered task sequence with distances

#### GAP-5.2: Create `pick_routes` Prisma model
- **File:** `prisma/schema.prisma`
- Fields: `route_id`, `wave_id`, `picker_id`, `sequence_order`, `task_id`, `location_id`, `estimated_travel_distance`, `actual_start_time`, `actual_end_time`

#### GAP-5.3: Update `nextTask` for route optimization
- **File:** `src/outbound/picking-tasks/picking-task.service.ts`
- When multiple tasks available for a user, sequence them by proximity to current location
- Return task with `nextLocation`, `estimatedDistance`, `routeSequence`

---

## GAP-6: Missing Task Interleaving for Picking

**Manhattan Reference:** After picking complete at a location, system may assign Putaway, Cycle Count, or Replenishment based on proximity  
**Current State:** No cross-workflow interleaving. See also Putaway Plan GAP-5.  
**Impact:** Same as putaway — wasted empty travel.

### Tasks

#### GAP-6.1: Expose "next pick task" for interleaving engine
- **File:** `src/outbound/picking-tasks/picking-task.service.ts`
- Method: `getNextInterleavableTask(tenantId, facilityId, currentLocationId)`
- Return nearest available pick task to given location

#### GAP-6.2: Integrate with central task interleaving service
- Same service as planned in Putaway Plan (`src/common/task-interleaving/`)

---

## GAP-7: Missing Allocation Validation Before Pick

**Manhattan Reference:** Allocation reserves inventory before picking. If only 8 units physically exist for 10 reserved → allocation invalid, order may go partial.  
**Current State:** `confirmPick` decrements inventory. No pre-pick allocation validation against current on-hand.  
**Impact:** Pickers arrive at location to find less inventory than expected. Short pick is reactive, not proactive.

### Tasks

#### GAP-7.1: Add pre-pick allocation validation
- **File:** `src/outbound/picking-tasks/picking-task.service.ts`
- New method: `validatePrePick(tenantId, taskId)`
  - Compare `quantity_to_pick` vs current `inventory_on_hand.quantity_on_hand`
  - If insufficient: flag task as `AT_RISK`, notify wave manager, trigger replenishment check
  - If sufficient: mark task as `READY`
- Call this during `nextTask` retrieval

#### GAP-7.2: Create auto-replenishment trigger
- If forward pick location has insufficient inventory:
  - Check reserve for same product
  - Auto-create replenishment task (if auto-replenishment enabled)
  - Set pick task to `WAITING_REPLENISHMENT`

---

## Summary: Files to Create/Update

### New Files
| # | File | Purpose |
|---|------|---------|
| 1 | `src/outbound/waves/wave.service.ts` | Wave creation, status, completion check |
| 2 | `src/outbound/waves/web/wave.controller.ts` | Web wave CRUD |
| 3 | `src/outbound/waves/wave.module.ts` | NestJS module |
| 4 | `src/outbound/picking-tasks/pick-route.service.ts` | Route optimization engine |
| 5 | `src/outbound/picking-tasks/cluster-pick.service.ts` | Cluster picking logic |

### New Prisma Tables
| # | Table | Purpose |
|---|-------|---------|
| 1 | `picking_waves` | Wave status and tracking |
| 2 | `pick_carts` | Cluster/batch picking cart definitions |
| 3 | `pick_cart_assignments` | Tote-to-shelf assignments for cluster picking |
| 4 | `pick_routes` | Route optimization sequence |
| 5 | `pick_batch_sessions` | Batch picking session tracking |
| 6 | `cluster_pick_groups` | Cluster pick task grouping |

### Updated Prisma Tables
| # | Table | Changes |
|---|-------|---------|
| 1 | `picking_tasks` | Add wave_id, pick_type, at_risk (bool), route_sequence, cluster_group_id |
| 2 | `products` | Add eaches_per_case, cases_per_pallet, preferred_pick_uom |
| 3 | `sales_orders` | Add wave_id |

### Updated Files
| # | File | Changes |
|---|------|---------|
| 1 | `src/outbound/picking-tasks/picking-task.service.ts` | Add cluster pick, batch pick, case pick, wave integration, route optimization, pre-pick validation, task interleaving |
| 2 | `src/outbound/picking-tasks/rf/picking.controller.ts` | Add 10+ new RF endpoints (cluster, batch, wave, route-related) |
| 3 | `src/outbound/picking-tasks/picking-tasks.module.ts` | Register new services |
| 4 | `src/outbound/outbound.module.ts` | Register wave module |
| 5 | `prisma/schema.prisma` | Add 6 tables, modify 3 tables |
| 6 | `src/common/casl/casl-ability.factory.ts` | Add CASL subjects: 'Wave', 'PickRoute', 'PickCart' |

### RF Endpoints Added
| Route | Action | Purpose |
|-------|--------|---------|
| `POST rf/outbound/pick/setup-cluster` | create | Setup cluster pick with cart + totes |
| `POST rf/outbound/pick/cluster-next` | read | Next task for cluster session |
| `POST rf/outbound/pick/distribute` | update | Distribute pick to multiple totes |
| `POST rf/outbound/pick/cluster-complete` | update | Complete cluster session |
| `POST rf/outbound/pick/batch-start` | create | Start batch pick |
| `POST rf/outbound/pick/bulk-confirm` | update | Confirm bulk pick |
| `POST rf/outbound/pick/batch-complete` | update | Complete batch phase |
| `POST rf/outbound/pick/wave-status` | read | View wave progress |
| `POST rf/outbound/pick/validate-inventory` | read | Pre-pick allocation check |
| `POST rf/outbound/pick/next-interleaved` | read | Get interleaved task (cross-workflow) |

### Web Endpoints Added
| Route | Method | Purpose |
|-------|--------|---------|
| `/web/waves[/:id]` | POST/GET/PATCH | Wave CRUD |
| `/web/waves/:id/status` | GET | Wave detail with task progress |
| `/web/waves/:id/close` | POST | Close wave |
| `/web/waves/:id/tasks` | GET | All tasks in wave |
| `/web/pick-routes/:waveId` | GET | View optimized route |

---

## Priority & Effort

| Priority | Item | Effort |
|----------|------|--------|
| HIGH | GAP-4: Wave-level operations | Large |
| HIGH | GAP-1: Cluster picking | Large |
| MEDIUM | GAP-5: Route optimization | Large |
| MEDIUM | GAP-7: Allocation validation | Medium |
| MEDIUM | GAP-3: Case pick handling | Medium |
| LOW | GAP-2: Batch picking | Large |
| LOW | GAP-6: Task interleaving | Large (cross-module) |

---

## APPENDIX: Post-Verification Critical Missing Items

### APP-PICK-A: Full Pallet Picking

**Manhattan:** "Pick Pallet → LPN: PALLET-1001 → Drive forklift → Scan pallet LPN to validate → Lift entire pallet → Move to staging." Handles entire pallet once rather than breaking + picking + rebuilding.  
**Current State:** Entirely missing. No pallet-level pick task type. No forklift integration. No bulk-pallet movement records.  
**Tasks to add:**
- Add `pick_type` to picking_tasks: EACH / CASE / PALLET / FULL_PALLET
- Add `full_pallet_picking` mode: one task per pallet (not per product), validate pallet LPN, move entire pallet
- Check inventory_on_hand for the pallet LPN (not individual items)
- Create single inventory_transaction for full pallet movement (no per-item breakdown)
- RF endpoint: `POST rf/outbound/pick/scan-pallet` — validate pallet LPN (not tote)
- RF endpoint: `POST rf/outbound/pick/confirm-pallet` — confirm pallet pick

### APP-PICK-B: Forklift Equipment Model

**Manhattan:** Forklift vs pedestrian picking, full pallet vs case picking require different equipment.  
**Current State:** No equipment type in picking. No equipment-based task filtering.  
**Tasks to add:**
- Add `required_equipment` to picking_tasks (FORKLIFT / REACH_TRUCK / PALLET_JACK / PEDESTRIAN)
- Add `equipment_type` to RF sessions
- In `nextTask()`: filter tasks by operator's current equipment type
- Full-pallet picks → FORKLIFT only; case picks → PALLET_JACK or PEDESTRIAN; each picks → PEDESTRIAN

### APP-PICK-C: Reserve vs Forward Pick Segregation

**Manhattan:** Reserve storage (bulk, high-bay) is separate from Forward Pick (ground-level, fast-access). Replenishment moves inventory from Reserve → Forward Pick. Picking happens from Forward Pick.  
**Current State:** No location type distinction in picking. All locations treated equally.  
**Tasks to add:**
- Add `location_type` to storage_locations (FORWARD_PICK / RESERVE / STAGING)
- Picking tasks should ONLY target FORWARD_PICK locations (not RESERVE)
- If forward pick is empty → trigger replenishment (see APP-PICK-D)
- Replenishment tasks target RESERVE → FORWARD_PICK movement

### APP-PICK-D: Proactive Replenishment (Prevent Short Picks)

**Manhattan:** Forward pick inventory falls below threshold → auto-generate replenishment BEFORE picker arrives. Prevents short picks proactively.  
**Current State:** `shortPick` is reactive (handles shortage after it's discovered). No proactive replenishment.  
**Tasks to add:**
- On wave creation / allocation: check forward pick inventory against demand
- If forward pick qty < required qty → create replenishment task BEFORE pick task
- Set pick task to `WAITING_REPLENISHMENT` until replenishment completes
- Monitor forward pick levels continuously (BullMQ job: `replenishment-monitor`)
- Configurable threshold: e.g., trigger replenishment when forward pick < 20% of max capacity

### APP-PICK-E: Short Pick Reason Codes + Allocation Revalidation

**Manhattan:** Short pick must record: WHY (damage, missing, wrong count, etc.) + trigger corrective action. After short pick, re-validate allocation for remaining order qty.  
**Current State:** `shortPick` accepts `shortReason` but has no structured reason code lookup. No allocation revalidation.  
**Tasks to add:**
- Create `short_pick_reasons` table (reason_code, description, triggers_recount, triggers_investigation)
- Validate shortReason against table
- After short pick: recalculate order line fulfillment (remaining qty = allocated - picked)
- If remaining qty > 0 and no more inventory → auto-create backorder
- If remaining qty > 0 and inventory exists elsewhere → auto-create new pick task

### APP-PICK-F: Backorder Creation

**Manhattan:** When picked qty < ordered qty and no more inventory available → create backorder.  
**Current State:** Short pick records shortage but doesn't create backorder. Order line stays SHORT indefinitely.  
**Tasks to add:**
- Add method: `createBackorder(tenantId, orderLineId, shortfallQty)`
- Create `backorder_records` table (order_line_id, shortfall_qty, status: OPEN/FULFILLED/CANCELLED)
- When new inventory is received for the product → attempt to fulfill backorder
- Web: GET `/web/backorders` — list all open backorders

### APP-PICK-G: Location-Scan Mismatch Validation

**Manhattan:** The most critical picking error is scanning wrong location. System MUST reject with "WRONG LOCATION" error at scan time (not later).  
**Current State:** `scanLocation()` exists but plan doesn't detail the rejection flow.  
**Tasks to add:**
- In RF `scan-location`: compare scanned location against task's `from_location_id`
- If mismatch: return error `{ allowed: false, message: "WRONG LOCATION — Expected: A-01-01-01, Scanned: B-02-01-03" }`
- Log mismatch attempt to audit trail for fraud/error detection
- Three mismatch attempts → lock task + escalate to supervisor

### APP-PICK-H: Tote-to-Order Association Validation

**Manhattan:** Wrong tote scanned → Customer A gets Customer B's inventory.  
**Current State:** `scanTote()` finds/creates tote but doesn't validate tote belongs to the current order.  
**Tasks to add:**
- In `scanTote()`: if tote already exists and has an order association → validate it matches current task's order
- If mismatch: reject with "WRONG TOTE — Belongs to Order SO-10002, Current Order SO-10001"
- Mark tote with `assigned_order_id` when first assigned to prevent cross-order mixing

### APP-PICK-I: Task Concurrency (Double-Pick Prevention)

**Manhattan:** Two operators must not pick the same task or the same inventory at the same location.  
**Current State:** `nextTask()` returns tasks that are ASSIGNED (if user has pending) or AVAILABLE. But no locking prevents race condition.  
**Tasks to add:**
- On `nextTask()`, use atomic update: `WHERE task_id=X AND status=AVAILABLE SET status=ASSIGNED`
- If update returns 0 → retry with next task (another operator grabbed it)
- For cluster picks: lock all tasks in the group atomically
- On task timeout / session expiry: auto-unassign tasks (return to AVAILABLE)

### APP-PICK-J: Inventory Movement FROM→TO Audit Trail

**Manhattan:** Every pick records: FROM location → TO tote/LPN, quantity, operator, timestamp.  
**Current State:** `inventory_transactions` are created. But no unified pick audit log table.  
**Tasks to add:**
- Create `pick_audit_log` table (task_id, from_location_id, to_lpn_id, to_tote_id, product_id, qty_picked, qty_remaining, event_type: PICK_START/LOCATION_SCANNED/PRODUCT_VERIFIED/PICK_CONFIRMED/SHORT_PICK/COMPLETED, recorded_at, recorded_by)
- Write audit entry at each pick step (not just confirm)
- Web: GET `/web/audit/pick/:taskId/timeline`

### APP-PICK-K: Batch Sortation Model

**Manhattan:** Batch picking → bulk gather → sortation at packing station.  
**Current State:** GAP-2 mentions batch picking but provides no sortation model.  
**Tasks to add:**
- Add `batch_sortation_sessions` table
- After bulk pick completes: create sortation work for each order within the batch
- RF sortation screen: scan item → display "Put 3 → Order A Tote, Put 2 → Order B Tote"
- Validate sortation distribution matches order requirements
- Web: GET `/web/sortation/batches` — monitor sortation progress

### APP-PICK-L: Order Cancellation Mid-Pick

**Manhattan:** If order is cancelled while picks are in progress.  
**Current State:** No handling for mid-pick cancellation.  
**Tasks to add:**
- On order cancel: check for IN_PROGRESS or ASSIGNED pick tasks
- Method: `cancelPickTask(tenantId, taskId, reason)` — status → CANCELLED
- Restore inventory: return picked qty to source location
- Notify operator on RF: "Pick Task Cancelled — Order SO-10001 Cancelled"

### APP-PICK-M: RF Offline / Resume

**Manhattan:** RF device may lose connectivity mid-pick. Operator should be able to resume where they left off.  
**Current State:** No offline/resume capability.  
**Tasks to add:**
- Store pick state in RF session data (local cache of current task progress)
- On reconnect: query active tasks for user → resume from last confirmed step
- Allow continuation from any step in the pick flow (not just restart)
- Mark tasks with `last_known_state` and `last_known_step`
