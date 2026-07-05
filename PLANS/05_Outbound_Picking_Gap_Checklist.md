# Outbound Picking — Exhaustive Gap Checklist

**Source Docs:** Manhattan RF Operations Suite Parts 1–4 vs Implementation Plan (05_Outbound_Picking_Implementation_Plan.md)

---

## DOCUMENT 1 — Wave Picking Deep Dive Part 1

### Process Steps

| # | Manhattan Step | Status | Notes |
|---|---------------|--------|-------|
| 1 | Picker "Gets work" | COVERED | `nextTask` endpoint exists |
| 2 | Picker pushes cart or drives forklift | MISSING | No equipment-type differentiation; plan assumes pedestrian/cart but doesn't model forklift vs cart vs pedestrian equipment types, equipment assignment, or equipment-compatible task filtering |
| 3 | Picker travels to location | COVERED | Implicit in flow |
| 4 | Picker picks inventory | COVERED | `confirmPick` |
| 5 | Picker places inventory into destination container | COVERED | `scanTote` + `confirmPick` |
| 6 | Pick-To-Tote: Scan tote barcode (TOTE-001) | COVERED | `scanTote` endpoint |
| 7 | Quantities combined: Picker sees "Pick SKU-A Qty 10" (not 4 separate orders) | COVERED | Wave grouping in GAP-4 |

### Validation Rules

| # | Manhattan Rule | Status | Notes |
|---|---------------|--------|-------|
| 8 | System must know FROM location and TO tote for every pick | PARTIALLY COVERED | `confirmPick` records `from_location_id` and `destination_tote_id`, but no explicit inventory-movement audit record is created with FROM→TO atomic tracking |
| 9 | Inventory traceability: warehouse must know where inventory went after leaving location | PARTIALLY COVERED | Tote is recorded as destination, but no cross-reference validation ensuring tote was scanned before pick, and no traceability chain (location→tote→pack→ship) |
| 10 | RF guidance ensures correct location, correct quantity, correct tote at every step | PARTIALLY COVERED | Individual validations exist but no unified three-way check enforcing all three simultaneously |

### Data Fields

| # | Field | Status | Notes |
|---|-------|--------|-------|
| 11 | Tote barcode (TOTE-001) | COVERED | In `scanTote` |
| 12 | FROM location | COVERED | `from_location_id` in task |
| 13 | TO tote | COVERED | `destination_tote_id` |
| 14 | Pick quantity (combined across orders) | COVERED | `quantity_to_pick` |
| 15 | Tote lifecycle status | PARTIALLY COVERED | Plan mentions totes but not their lifecycle statuses (CREATED, PICK_IN_PROGRESS, PICK_COMPLETE, READY_FOR_PACK) |

### Status Transitions

| # | Transition | Status | Notes |
|---|------------|--------|-------|
| 16 | Tote: CREATED → PICK_IN_PROGRESS → PICK_COMPLETE → READY_FOR_PACK | MISSING | Plan does not model tote status lifecycle; these specific state names are not referenced anywhere |
| 17 | Inventory: Available (at location) → Ready for Packing (in tote) | MISSING | Plan doesn't model inventory state per location/container; only decrements quantity at location. The "ready for packing" state is not represented |
| 18 | Location owns inventory → Tote owns inventory (ownership transfer) | MISSING | No explicit inventory-ownership-transfer modeling; plan focuses on quantity decrement, not container-ownership tracking |

### Business Rules

| # | Rule | Status | Notes |
|---|------|--------|-------|
| 19 | Picking converts inventory from "Available" to "Ready for Packing" | MISSING | State transition not modeled |
| 20 | Picking is the bridge between Inventory Storage and Customer Fulfillment | COVERED | Architectural intent is implicit |
| 21 | Wave picks group order-level demand into warehouse-level work | COVERED | GAP-4 wave operations |
| 22 | Without wave-based picking, travel distance becomes enormous | COVERED | Mentioned as motivation |
| 23 | What breaks if tote not scanned: inventory disappears from traceability | MISSING | Plan doesn't enforce mandatory tote scan before pick confirmation; no "unscanned tote" guard |
| 24 | Benefits: Reduced walking, Higher productivity, Better pack station throughput, Improved order consolidation | MISSING | No metrics tracking for these KPIs |

---

## DOCUMENT 2 — Cluster & Batch Picking, Travel Optimization

### Process Steps

| # | Manhattan Step | Status | Notes |
|---|---------------|--------|-------|
| 25 | Cluster picking setup: associate cart, assign totes to shelves | COVERED | GAP-1.3 `setupClusterPick` |
| 26 | Cluster pick: Visit location, pick total qty once | COVERED | GAP-1.3 `getClusterPickTasks` |
| 27 | Cluster pick: Distribute picked qty across totes (e.g., 2→A, 3→B, 1→C) | COVERED | GAP-1.3 `distributePick` |
| 28 | Picker physically places quantities into different totes, continues route | COVERED | Implicit |
| 29 | Batch pick: Gather bulk inventory for many orders at once | COVERED | GAP-2.1 `createBatchPick` |
| 30 | Batch pick: Sorting occurs later at packing/sortation stations | PARTIALLY COVERED | GAP-2.1 mentions "generate sortation work" but provides zero detail on sortation model, sortation task lifecycle, sortation RF flow, or put wall |
| 31 | RF display for cluster: Location + Pick Qty → Put instructions per tote | COVERED | GAP-1.4 |
| 32 | RF display for batch: No order context, bulk SKU + qty only | COVERED | GAP-2.3 `bulk-confirm` |

### Validation Rules

| # | Manhattan Rule | Status | Notes |
|---|---------------|--------|-------|
| 33 | Cluster: Sum of put quantities across totes must equal total picked qty | COVERED | GAP-1.3 `validateClusterDistribution` |
| 34 | Cluster: Each tote must be assigned to a shelf | COVERED | GAP-1.2 `pick_cart_assignments` |
| 35 | Cluster: Each distribution qty must not exceed order's line qty | MISSING | `distributePick` validates total but doesn't cross-check that per-tote qty ≤ per-order line qty |
| 36 | Batch: SKU picked in bulk, order context must be resolved later at sorting | MISSING | No validation that sorting eventually completes before order is marked ready-to-pack |
| 37 | RF must ensure correct location, correct quantity, correct tote | PARTIALLY COVERED | Same three-way validation gap as Document 1 |

### Data Fields

| # | Field | Status | Notes |
|---|-------|--------|-------|
| 38 | Cart code | COVERED | GAP-1.1 `cart_code` |
| 39 | Cart type (CLUSTER/BATCH) | COVERED | GAP-1.1 `cart_type` |
| 40 | Number of shelves (3-6) | COVERED | GAP-1.1 `num_shelves` |
| 41 | Shelf position (TOP/MIDDLE/BOTTOM) | COVERED | GAP-1.2 `shelf_position` |
| 42 | Tote-to-shelf assignment | COVERED | GAP-1.2 `tote_id` |
| 43 | Assignment order (shelf sequence number) | COVERED | GAP-1.2 `assignment_order` |
| 44 | Pick session ID (links cart assignment to active pick session) | COVERED | GAP-1.2 `pick_session_id` |
| 45 | Batch session status (CREATED/PICKING/BULK_COMPLETE/SORTING/COMPLETED) | COVERED | GAP-2.2 |
| 46 | Bulk pick qty (total SKU qty across all orders) | COVERED | Implicit in batch pick |
| 47 | Sortation task/work reference | MISSING | No field linking batch pick to pending sortation |

### Status Transitions

| # | Transition | Status | Notes |
|---|------------|--------|-------|
| 48 | Batch session: CREATED → PICKING → BULK_COMPLETE → SORTING → COMPLETED | COVERED | GAP-2.2 |
| 49 | Cluster session: start → active → complete | PARTIALLY COVERED | Endpoints exist but no explicit session state model |

### Business Rules

| # | Rule | Status | Notes |
|---|------|--------|-------|
| 50 | Walking is the largest inefficiency — cluster picking reduces location revisits | COVERED | Motivation cited |
| 51 | Cluster picking = Sort During Picking; Batch picking = Sort Later | COVERED | Concepts captured |
| 52 | Batch picking best for very high order volumes | PARTIALLY COVERED | No threshold definition for when system auto-selects batch vs cluster vs pick-to-tote |
| 53 | Batch picking used when sortation infrastructure exists | MISSING | No facility-level sortation-capability flag; batch may be allowed at facilities without sorters |
| 54 | Picker walks 10–20 KM per shift — route optimization critical | PARTIALLY COVERED | Route optimization in GAP-5, but no travel distance tracking per picker/shift |
| 55 | Route sequence: Aisle 1→2→3→4, not 1→10→2→9 | COVERED | GAP-5.1 nearest-neighbor |
| 56 | Manhattan optimization goals: Reduce walking, forklift travel, congestion; Increase picks per hour, equipment utilization | PARTIALLY COVERED | Walking/forklift addressed (GAP-5). Congestion, picks-per-hour, equipment utilization not tracked |
| 57 | Puma example: 500 orders, 1000 qty → bulk pick instead of 500 individual picks | PARTIALLY COVERED | Batch pick concept covered, but auto-detection of bulk-pick-eligible SKUs (qty threshold across orders) is not specified |
| 58 | Directed work: system assigns work, picker doesn't choose | PARTIALLY COVERED | `nextTask` assigns work, but no mechanism preventing picker from picking a non-assigned task |
| 59 | Scan destination containers (best practice) | COVERED | `scanTote` |
| 60 | Validate every inventory movement (best practice) | PARTIALLY COVERED | Movement audit trail not created |

---

## DOCUMENT 3 — Full Pallet, Case Picking, Forklift, Reserve/Forward, Replenishment

### Process Steps

| # | Manhattan Step | Status | Notes |
|---|---------------|--------|-------|
| 61 | Full pallet pick: Drive to location, Scan pallet LPN, Lift, Move to staging | MISSING | No full-pallet picking workflow whatsoever. Plan covers case picking (GAP-3) but omits pallet-level |
| 62 | Forklift operator specific workflow (drive, scan pallet, lift, move) | MISSING | No equipment-specific workflow; no forklift vs pedestrian differentiation in task assignment or RF flow |
| 63 | Case pick: Select 2 cases (24 units) instead of 24 individual picks | COVERED | GAP-3.1 case pick support |
| 64 | Replenishment: Operator moves inventory FROM Reserve TO Forward Pick | PARTIALLY COVERED | GAP-7.2 mentions auto-creating replenishment task but no RF replenishment screen, no replenishment task model, no replenishment operator workflow |
| 65 | Replenishment is assigned as a separate task type (different from picking) | MISSING | GAP-7.2 treats replenishment as a side-effect of pre-pick validation, not as an independent task type with its own lifecycle, operators, and RF interface |
| 66 | Manhattan proactively replenishes before pick face empties (not reactively) | MISSING | GAP-7.2 is reactive (triggers at pick time when shortage detected). No proactive monitoring of pick face levels and threshold-based trigger |

### Validation Rules

| # | Manhattan Rule | Status | Notes |
|---|---------------|--------|-------|
| 67 | Pallet LPN scan validation (correct pallet for this order) | MISSING | No LPN validation in picking |
| 68 | Forklift RF validation: correct pallet, correct location, correct shipment | MISSING | No forklift-specific three-way check |
| 69 | Case pick: Verify case quantity (each qty = case_count × eaches_per_case) | COVERED | GAP-3.1 |
| 70 | Pallet pick: Verify pallet quantity (each qty = pallet_count × cases_per_pallet × eaches_per_case) | MISSING | Pallet-level UOM conversion not addressed |
| 71 | Replenishment: Verify destination forward pick location has capacity before moving | MISSING | No forward-pick-location capacity check |
| 72 | Forklift tasks require RF validation for every movement (best practice) | MISSING | No forklift-specific validation flow |

### Data Fields

| # | Field | Status | Notes |
|---|-------|--------|-------|
| 73 | Pallet LPN (e.g., PALLET-1001) | MISSING | No LPN reference in picking task model or workflow |
| 74 | Pick type: EACH / CASE / PALLET | PARTIALLY COVERED | GAP-3.1 `pickType` but only EACH and CASE detailed; PALLET not specified |
| 75 | UOM ID for pick task | COVERED | GAP-3.1 `uomId` |
| 76 | eaches_per_case | COVERED | GAP-3.2 product field |
| 77 | cases_per_pallet | COVERED | GAP-3.2 product field |
| 78 | preferred_pick_uom | COVERED | GAP-3.2 product field (but static; see rule #102) |
| 79 | Forward pick location designation | MISSING | No field to mark a storage location as FORWARD vs RESERVE |
| 80 | Reserve storage location designation | MISSING | Same as above — location type segregation not modeled |
| 81 | Replenishment task type | MISSING | Replenishment not modeled as a standalone task type with its own fields (from_reserve_loc, to_forward_loc, replenish_qty, trigger_reason) |
| 82 | Equipment type assigned to task (carts, forklift, pedestrian) | MISSING | No equipment field in task model |
| 83 | Operator equipment assignment | MISSING | No picker-to-equipment association |

### Status Transitions

| # | Transition | Status | Notes |
|---|------------|--------|-------|
| 84 | Replenishment task lifecycle: CREATED → ASSIGNED → IN_PROGRESS → COMPLETED | MISSING | No replenishment task model |
| 85 | Forward pick location: Empty → Replenishment Triggered → Restocked → Ready | MISSING | No forward-pick-location state tracking |
| 86 | Reserve inventory: Available → Allocated for Replenishment → Moved to Forward Pick | MISSING | No inventory movement between reserve and forward |

### Business Rules

| # | Rule | Status | Notes |
|---|------|--------|-------|
| 87 | Full pallet picks used for wholesale/retail replenishment orders | MISSING | No pallet picking |
| 88 | Handling inventory once (full pallet) is cheaper than break-pick-rebuild | MISSING | No cost/efficiency consideration |
| 89 | Case handling faster than individual picks | COVERED | GAP-3 motivation |
| 90 | Food/consumer goods warehouses primarily use case picking | COVERED | GAP-3 motivation |
| 91 | Forklift operators may travel hundreds of meters for single task | MISSING | Not tracked/modeled |
| 92 | Forward pick = ground-level fast access; Reserve = upper rack bulk buffer | MISSING | Location segregation not modeled |
| 93 | Keeping all inventory in pick locations wastes space | MISSING | No space optimization consideration |
| 94 | Picking and replenishment involve different equipment and different operators — must be separate tasks | MISSING | No operator/equipment role segregation |
| 95 | If replenishment ignored: picker finds 0 inventory → short pick → customer delay | PARTIALLY COVERED | Short pick handled (confirmPick) but the consequence chain (0 inv → short pick → delay) not fully modeled. GAP-7 flags AT_RISK but doesn't prevent the scenario |
| 96 | Manhattan replenishes BEFORE pick face empties | MISSING | Proactive replenishment not designed |
| 97 | Auto-replenishment trigger when forward pick qty drops below threshold | MISSING | GAP-7.2 is reactive at pick-time, not threshold-based continuous monitoring |
| 98 | Use full pallet picks whenever possible (best practice) | MISSING | No pallet picking |
| 99 | Use case picks before each picks (best practice) | PARTIALLY COVERED | `preferred_pick_uom` is static per product; doesn't dynamically prefer case when order qty ≥ case qty |
| 100 | Separate reserve and forward inventory (best practice) | MISSING | No segregation model |
| 101 | Automate replenishment (best practice) | PARTIALLY COVERED | GAP-7.2 partially automates but only reactively |
| 102 | RF validation for all forklift tasks (best practice) | MISSING | No forklift-specific validation |
| 103 | Minimize inventory touches (best practice) | MISSING | No touch-count tracking or minimization logic |

---

## DOCUMENT 4 — Task Interleaving, Short Pick, Wave Completion, Failure Scenarios

### Process Steps

| # | Manhattan Step | Status | Notes |
|---|---------------|--------|-------|
| 104 | Task interleaving: After Pick, system assigns Putaway/Cycle Count based on proximity | COVERED | GAP-6 |
| 105 | Forklift: drops pallet → system assigns productive work for return trip | PARTIALLY COVERED | Interleaving engine covered, but forklift-specific return-trip optimization (pallet empty = can carry new load) not detailed |
| 106 | Short pick flow: "Enter Actual Qty" → picker enters 8 (of required 10) | PARTIALLY COVERED | `confirmPick` handles qty discrepancy, but no dedicated short-pick RF screen, no reason-code capture, no forced confirmation of shortage |
| 107 | Wave completion check: evaluate ALL tasks (picks + exceptions + replenishments) | COVERED | GAP-4.2 `checkWaveCompletion` |
| 108 | Wave close: finalize wave, transition to packing stage | PARTIALLY COVERED | `closeWave` mentioned but what "transition to packing" entails is not detailed (auto-notify pack station, auto-print labels, create pack tasks) |

### Validation Rules

| # | Manhattan Rule | Status | Notes |
|---|---------------|--------|-------|
| 109 | Short pick: Validate actual_qty ≤ required_qty | PARTIALLY COVERED | Implicit in confirm, but no explicit "short pick must be less than requested" validation; overpick case not handled |
| 110 | Short pick: Shortage must be recorded with reason code | MISSING | No reason-code field or DTO |
| 111 | Short pick: Allocation must be revalidated after short pick (only 8 reserved, not 10) | MISSING | No allocation revalidation or reallocation after short pick |
| 112 | Wave complete: ALL tasks must be resolved (no pending shortages, no pending replenishments) | COVERED | GAP-4.2 |
| 113 | Wave complete: Outstanding exceptions still affect customer shipments | COVERED | Motivation captured |
| 114 | Wrong tote prevention: Tote must match order assignment | MISSING | `scanTote` validates tote exists but doesn't verify tote-to-order association correctness |
| 115 | Wrong location prevention: Scanned location must match task's assigned location | MISSING | Location scan exists but no explicit mismatch guard that rejects an adjacent-location scan |
| 116 | Task interleaving: Validate equipment compatibility (forklift task requires forklift) | MISSING | Not in interleaving plan |
| 117 | Task interleaving: Validate operator certification for equipment type | MISSING | Not addressed |
| 118 | Cycle count integration: Short pick triggers recount | MISSING | No automatic cycle-count creation on short pick |
| 119 | Backorder creation: Unfulfillable qty creates backorder | MISSING | No backorder creation logic |

### Data Fields

| # | Field | Status | Notes |
|---|-------|--------|-------|
| 120 | Short pick reason code | MISSING | No reason-code field (receiving error, picking error, damage, misplaced) |
| 121 | Short pick actual quantity | PARTIALLY COVERED | `confirmPick` DTO likely has actual_qty but not confirmed |
| 122 | Short pick flag on task | MISSING | No `is_short_pick` boolean or `short_pick_status` on task |
| 123 | Wave total_tasks, completed_tasks, short_picks counts | COVERED | GAP-4.1 `picking_waves` |
| 124 | Wave status aggregate | COVERED | GAP-4.1 |
| 125 | Investigation task reference (for repeated shortages) | MISSING | No investigation task model |
| 126 | Cycle count trigger reference (from short pick) | MISSING | No link from short pick to triggered cycle count task |
| 127 | Backorder reference | MISSING | No backorder model or link |
| 128 | Interleaving priority score / task rank | MISSING | Plan mentions exposing next task but doesn't define how priority/rank is computed |
| 129 | Congestion zone flag | MISSING | Not modeled |

### Status Transitions

| # | Transition | Status | Notes |
|---|------------|--------|-------|
| 130 | Wave: CREATED → ALLOCATED → IN_PROGRESS → PARTIALLY_COMPLETE → COMPLETE → CLOSED | COVERED | GAP-4.1 |
| 131 | Wave: NOT COMPLETE if any short pick outstanding | COVERED | GAP-4.2 `checkWaveCompletion` |
| 132 | Order: PICKED → PARTIALLY_FULFILLED (after short pick) | MISSING | Order partial-fulfillment state not modeled |
| 133 | Order: PARTIALLY_FULFILLED → BACKORDERED (unfulfillable portion) | MISSING | No backorder state |
| 134 | Task: AT_RISK / WAITING_REPLENISHMENT | COVERED | GAP-7.1, GAP-7.2 |

### Edge Cases / Exception Flows

| # | Scenario | Status | Notes |
|---|----------|--------|-------|
| 135 | Short pick: Requested 10, only 8 available (system believed 10, reality 8) | PARTIALLY COVERED | Pick confirmation handles qty difference, but no inventory-accuracy alert, no auto-cycle-count, no allocation revalidation |
| 136 | Short pick cause: Receiving error (qty never arrived) | MISSING | No root-cause classification or capture |
| 137 | Short pick cause: Previous picking error (prior picker removed incorrectly) | MISSING | No root-cause classification |
| 138 | Short pick cause: Damage (inventory became unusable) | MISSING | No damage capture during pick; no damaged-inventory workflow |
| 139 | Short pick cause: Misplaced inventory (exists but elsewhere) | MISSING | No misplaced-inventory investigation trigger |
| 140 | Wrong tote scanned: Customer A receives Customer B inventory | MISSING | No tote-to-order validation that would catch this mismatch |
| 141 | Wrong location picked: Picker takes from adjacent location → inventory accuracy drops | MISSING | No location-match validation (`scanned_location !== task.from_location_id` guard) |
| 142 | Missing replenishment → pick face empty → mass short picks | PARTIALLY COVERED | GAP-7 flags AT_RISK but only per-task; no wave-level or facility-level empty-pick-face detection |
| 143 | Inventory not cycle counted → system inventory ≠ physical inventory | MISSING | No cycle-count frequency monitoring or drift detection |
| 144 | Picker enters overpick qty (picks 12 when asked for 10) | MISSING | No overpick validation or handling |
| 145 | Pick task split: Picker takes 8 of 10, remaining 2 need reassignment | MISSING | No task-splitting logic; task stays partially complete with no follow-up |
| 146 | Order cancelled mid-pick (order in wave gets cancelled while picking in progress) | MISSING | No cancellation handling for in-progress pick tasks |
| 147 | Multiple pickers working same wave — task concurrency/double-pick prevention | MISSING | No pessimistic locking or optimistic concurrency on pick task assignment |
| 148 | RF device loses connectivity mid-pick | MISSING | No offline/resume handling |
| 149 | Invalid barcode scanned (unknown tote, unknown location) | MISSING | No explicit error-handling strategy for unrecognized scans |
| 150 | Cart has fewer shelves than totes needed | MISSING | No cart-capacity validation in cluster setup |
| 151 | Tote weight/capacity exceeded (cluster picks multiple orders into same tote) | MISSING | No weight or capacity validation on tote during distribute |
| 152 | Wave partially allocated — some orders in wave couldn't be allocated | MISSING | No partial-allocation handling within wave creation |
| 153 | Replenishment task gets assigned but no operator available | MISSING | No task pool/queue for unassigned replenishment |
| 154 | Operator refuses interleaved task (wants only picking) | MISSING | No user-preference override for interleaving; documents note operators dislike it |

### Business Rules

| # | Rule | Status | Notes |
|---|------|--------|-------|
| 155 | Task interleaving: next best task based on current location, equipment, and warehouse priorities | PARTIALLY COVERED | Location-based proximity covered; equipment compatibility and priority ranking not detailed |
| 156 | Empty travel is biggest waste — interleaving uses return trips | COVERED | Motivation captured |
| 157 | Operators prefer single work type but warehouse productivity improves with interleaving | MISSING | Not addressed |
| 158 | Short pick affects: Inventory, Orders, Customers, Shipments | PARTIALLY COVERED | Inventory (decremented), Orders (partial mentioned). Customers and Shipments not addressed |
| 159 | Short pick = allocation becomes invalid | MISSING | No allocation revalidation |
| 160 | Short pick → order may become Partially Fulfilled or Backordered | MISSING | States not modeled |
| 161 | Short pick → Shipment Delay, Partial Shipment, Customer Complaint | MISSING | Not modeled |
| 162 | Manhattan response to short pick: Create Replenishment | PARTIALLY COVERED | GAP-7.2 |
| 163 | Manhattan response to short pick: Create Investigation | MISSING | No investigation task |
| 164 | Manhattan response to short pick: Trigger Recount | MISSING | No cycle count trigger |
| 165 | Manhattan response to short pick: Create Backorder | MISSING | No backorder creation |
| 166 | Track short pick reasons (best practice) | MISSING | No reason tracking |
| 167 | Investigate repeated shortages (best practice) | MISSING | No pattern detection |
| 168 | Maintain inventory accuracy above 99% (best practice) | MISSING | No accuracy KPI or monitoring |
| 169 | Use cycle counting aggressively (best practice) | MISSING | No cycle-count integration |
| 170 | Wave picking success = Correct Inventory, Correct Location, Correct Quantity, Correct Container, Correct Customer | PARTIALLY COVERED | The "5 Corrects" are individually partially covered but no unified enforcement or verification at wave-completion |
| 171 | "Correct Customer" specifically: ensure final packed shipment goes to correct customer | MISSING | No end-to-end customer-verification in pick flow |

---

## CROSS-CUTTING GAPS (Present Across All Documents)

| # | Category | Gap | Notes |
|---|----------|-----|-------|
| 172 | Equipment Model | No equipment type differentiation (carts, forklifts, pedestrian). Documents reference all three as distinct operational modes | Plan mentions carts only for cluster picking but doesn't model forklifts as an equipment type affecting task assignment, validation, or RF flow |
| 173 | Picker-to-Equipment Assignment | No association between picker and equipment type/capability | Forklift-certified operators vs pedestrian operators not differentiated |
| 174 | Pick Session Lifecycle | No explicit pick session start/end/active/timeout management | Documents describe "Get Work" flow; plan has tasks but no session concept tying multiple tasks to a single picker session |
| 175 | Multiple Simultaneous Sessions | Can a picker have multiple active sessions? | Not addressed |
| 176 | Inventory Reservation/Locking | No detail on how allocation prevents double-allocation or how inventory is locked during picking | Allocation is referenced but locking mechanism not specified |
| 177 | Lot/Serial Tracking During Pick | No mention of lot-number or serial-number capture for lot-tracked or serial-tracked products | Important for traceable products in food/pharma |
| 178 | Inventory Movement Audit Trail | No creation of audit records for inventory movements (FROM→TO) | `confirmPick` updates quantities but doesn't log a movement event with timestamp, user, from, to, qty |
| 179 | Pick Task Generation Algorithm | No detail on how allocation results translate to pick tasks (splitting by zone, location, product) | `createWave` mentions "generate pick tasks" but no algorithm specified |
| 180 | Wave Creation Input | What triggers wave creation? (manual, schedule, order-count threshold, time-based) | Not specified |
| 181 | Wave Order Selection Criteria | How are orders selected for inclusion in a wave? (FIFO, priority, destination, carrier) | Not specified |
| 182 | Sortation Model | Batch picking mentions sortation but no sortation task model, put wall, or sortation RF flow | Missing entirely |
| 183 | Pick Confirmation Audit Log | No audit trail for who confirmed what pick, when, with what quantities | Missing |
| 184 | Pack Station Handoff | Wave completion transitions to packing — what exactly is handed off, how are pack stations notified? | Not detailed |
| 185 | Replenishment as Independent Module | Replenishment is only a side-effect of picking in the plan; documents treat it as its own operation with separate tasks, operators, RF flow | Missing a standalone replenishment module |
| 186 | LPN (License Plate Number) Model | LPNs are referenced for pallets but no LPN model in the picking context | Missing |
| 187 | Capacity Checks | No cart-capacity, tote-weight, or forward-pick-location capacity checks | Missing across all flows |
| 188 | Pick Strategy Auto-Selection | No rules for when system should auto-select: pick-to-tote vs cluster vs batch vs case vs pallet | Static `preferred_pick_uom` per product, not dynamic per wave/order characteristics |
| 189 | Wave Priority/Urgency | `wave_type` enum exists (STANDARD/URGENT/RESHIP) but no logic for how priority affects task sequencing or resource allocation | Missing |
| 190 | Proactive Replenishment Monitoring | No continuous monitoring of forward-pick-face levels to trigger replenishment before they reach zero | Missing (only reactive GAP-7.2) |
| 191 | Staging Location for Completed Picks | After pick complete, where does the tote/cart go? No staging/drop-off concept | Not addressed |
| 192 | Pick Task Cancellation | No cancellation workflow (equipment failure, picker quits, emergency stop) | Missing |
| 193 | FIFO/FEFO During Pick | No mention of lot-rotation enforcement (FIFO/FEFO) when selecting which inventory to pick | Missing |
| 194 | Pick-from-multiple-locations | If order requires 100 units and location only has 60, does system split across locations? | Not addressed |

---

## SUMMARY STATISTICS

| Category | Count |
|----------|-------|
| COVERED | 49 |
| PARTIALLY COVERED | 55 |
| MISSING | 90 |
| **TOTAL ITEMS** | **194** |

### By Document

| Document | Covered | Partial | Missing | Total |
|----------|---------|---------|---------|-------|
| Part 1 (Wave Picking Basics) | 13 | 5 | 6 | 24 |
| Part 2 (Cluster, Batch, Travel) | 21 | 11 | 4 | 36 |
| Part 3 (Pallet, Case, Forklift, Replenishment) | 9 | 8 | 26 | 43 |
| Part 4 (Interleaving, Short Pick, Wave Complete, Failures) | 6 | 16 | 16 | 38 |
| Cross-Cutting | 0 | 0 | 23 | 23 |
| (Some items bridge documents — counts approximate) | | | | |

### Critical Gaps (High Severity)

1. **No full pallet picking** — entire picking mode missing
2. **No forklift-specific operations** — equipment type not modeled
3. **No reserve vs forward pick location segregation** — fundamental warehouse layout concept missing
4. **No proactive replenishment** — only reactive (GAP-7.2), leading to Scenario 3 (mass short picks)
5. **No short-pick reason codes** — root cause tracking absent
6. **No allocation revalidation after short pick** — allocation becomes stale
7. **No backorder creation** — unfulfillable demand silently dropped
8. **No cycle count integration** — inventory accuracy feedback loop missing
9. **No location-scan mismatch validation** — Scenario 2 (wrong location) not prevented
10. **No tote-to-order validation** — Scenario 1 (wrong tote) not prevented
11. **No task concurrency control** — double-pick prevention missing
12. **No inventory movement audit trail** — FROM→TO traceability incomplete
13. **No batch sortation model** — sortation exists only as a mention
14. **No equipment/operator compatibility in interleaving** — forklift tasks could go to pedestrian pickers
15. **No proactive pick-face monitoring** — replenishment not threshold-based
16. **No FIFO/FEFO during pick** — lot rotation not enforced
17. **No overpick handling** — if picker picks more than ordered
18. **No pick task splitting** — partial picks leave orphan remaining quantities
19. **No order cancellation mid-pick handling** — in-progress picks for cancelled orders
20. **No offline/resume for RF** — connection loss during pick
