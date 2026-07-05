# Outbound Shipping — RF Implementation Plan

**Reference:** Manhattan_RF_Operations_Suite_v1 Parts 1-2 + Deep Dive 1-3 (Staging + Load Management + RF Trailer Loading)  
**Existing Code:** `src/outbound/shipments/` — RfShippingController (3 endpoints), ShipmentService (10 methods), LoadService (11 methods)  
**Status:** 45% Complete — basic trailer loading (start-load, scan-lpn, close-trailer) exists; missing staging operations, directed loading work, shipment verification, multi-stop sequencing, pallet-loading shortcut, capacity validation, carrier handoff, and manifest integration  

---

## Summary of Manhattan Process (Three Phases)

### Phase A: Staging Operations
```
Packing Complete → Get Staging Work → Scan Carton → Move to Staging Lane → Scan Staging Location
→ Carton: PACKED → STAGED
```

### Phase B: Load Management
```
Create Load → Scan Load → Assign Trailer → Load: CREATED → PLANNED → ASSIGNED
```

### Phase C: RF Trailer Loading
```
Get Loading Work → Scan Trailer → Scan Carton → Physical Load → Confirm Loaded
→ Scan Next Carton... → Shipment Verification (all cartons present?)
→ Close Shipment → Close Load → Manifest → Carrier Handoff
```

---

## GAP-1: Missing Staging Operations (Entire Phase)

**Manhattan Reference:** Phase A — Dedicated staging workflow with Get Work, Scan Carton, Move to Staging Lane, Scan Staging Location  
**Current State:** No staging RF endpoints. `ShipmentService.stageShipment()` exists in service but not exposed to RF. Current shipping RF starts directly at trailer loading.  
**Impact:** Packed cartons have no documented move from packing station to staging lane. Loaders don't know where cartons are staged. "PACKED → SHIPPED" skips "STAGED" intermediate state.

### Tasks

#### GAP-1.1: Create `staging_lanes` Prisma model
- **File:** `prisma/schema.prisma`
- Fields: `lane_id`, `tenant_id`, `facility_id`, `lane_code`, `zone_id`, `lane_type` (CARRIER/ROUTE/DOOR/WAVE), `assigned_carrier_id` (nullable), `assigned_door_id` (nullable), `is_active`

#### GAP-1.2: Create Staging Service
- **File:** `src/outbound/staging/staging.service.ts`
- Methods:
  - `getNextStagingWork(tenantId, facilityId, userId)` — assign next carton to stage
  - `scanCartonForStaging(tenantId, cartonBarcode)` — validate carton is PACKED, not already STAGED
  - `moveToStagingLane(tenantId, cartonId, laneId, userId)` — update carton status to STAGED, record lane
  - `verifyStagingLane(tenantId, laneBarcode, expectedLaneId)` — validate scanned lane matches assigned

#### GAP-1.3: Create RF Staging Controller
- **File:** `src/outbound/staging/rf/staging.controller.ts`
- Route prefix: `rf/outbound/staging`
- Routes:
  - `POST rf/outbound/staging/get-next` — get next staging task
  - `POST rf/outbound/staging/scan-carton` — scan carton for staging
  - `POST rf/outbound/staging/confirm-lane` — scan + confirm staging lane
  - `POST rf/outbound/staging/my-tasks` — list active staging tasks

#### GAP-1.4: Create Staging Module
- **File:** `src/outbound/staging/staging.module.ts`

---

## GAP-2: Missing Directed Loading Work

**Manhattan Reference:** Phase C Step 1 — "Get Loading Work" — system assigns next loading task based on priority, door, trailer, load  
**Current State:** `startLoad` creates or finds a load by dock door scan. No "get work" assignment. Operator chooses which door to scan.  
**Impact:** No priority-based loading. No directed work. Operator may load low-priority trailer before high-priority.

### Tasks

#### GAP-2.1: Add `getNextLoadingWork` to LoadService
- **File:** `src/outbound/loads/load.service.ts`
- New method: `getNextLoadingWork(tenantId, facilityId, userId)`
  - Find load with status PLANNED or READY, sorted by planned_departure_date
  - Assign load to user (set `loaded_by`)
  - Return load + dock door + trailer + shipment count

#### GAP-2.2: Add RF endpoint
- **File:** `src/outbound/shipments/rf/shipping.controller.ts`
- Route: `POST rf/outbound/shipping/get-next` — directed loading work
- Modify `start-load` to accept optional loadNumber from `get-next`

---

## GAP-3: Missing Shipment Verification (All Cartons Present)

**Manhattan Reference:** Phase C Step 6 — "Shipment Verified?" — system checks all expected cartons are loaded; missing cartons block load closure  
**Current State:** `closeTrailer` closes the load and sets all shipments to SHIPPED without verifying completeness. `scanLpn` increments `loaded_cartons` but doesn't compare against expected total.  
**Impact:** Loads can be closed with missing cartons. Shipments are marked SHIPPED incompletely.

### Tasks

#### GAP-3.1: Add shipment verification method
- **File:** `src/outbound/shipments/shipment.service.ts`
- New method: `verifyShipmentCompleteness(tenantId, shipmentId)`
  - Count expected cartons (from packing_carton_plan or order.carton_count)
  - Count loaded cartons (LPNs with status LOADED assigned to this shipment)
  - Return: `{ isComplete, expected, loaded, missing }`

#### GAP-3.2: Add verification to close-trailer flow
- **File:** `src/outbound/shipments/rf/shipping.controller.ts` — `closeTrailer`
- Before closing: verify all shipments on the load are complete
- If not: return `{ blocked: true, incompleteShipments: [...] }`
- Provide "Force Close" option (supervisor only) for partial loads

#### GAP-3.3: Add RF verification endpoint
- **File:** `src/outbound/shipments/rf/shipping.controller.ts`
- Route: `POST rf/outbound/shipping/verify-shipment` — check if shipment is fully loaded
- Route: `POST rf/outbound/shipping/verify-load` — check if all shipments on load are complete

---

## GAP-4: Missing Multi-Stop Load Sequencing

**Manhattan Reference:** Multi-stop loads: last stop loaded FIRST, first stop loaded LAST (reverse order). Example: Stop 1 Bangalore, Stop 2 Chennai, Stop 3 Hyderabad → Hyderabad loaded first  
**Current State:** No stop management. `LoadService` has no concept of stops. Single destination per load.  
**Impact:** For multi-stop transportation, cartons are loaded in wrong order. Unloading at intermediate stops requires removing and reloading later-stop cartons.

### Tasks

#### GAP-4.1: Create `load_stops` Prisma model
- **File:** `prisma/schema.prisma`
- Fields: `stop_id`, `load_id`, `stop_sequence` (1=first delivery, N=last delivery), `shipment_id` (optional — specific shipments per stop), `location_name`, `arrival_planned_time`, `departure_planned_time`, `status`

#### GAP-4.2: Add multi-stop loading logic
- **File:** `src/outbound/loads/load.service.ts`
- Method: `getLoadingSequence(tenantId, loadId)`
  - If multi-stop: return reversed order (last stop first)
  - For each carton scan: validate carton's stop matches current loading stop
  - On RF display: "Loading Stop 3 of 3: Hyderabad"
- In `scanLpn`: validate carton belongs to current stop's shipments

#### GAP-4.3: RF multi-stop display
- **File:** `src/outbound/shipments/rf/shipping.controller.ts`
- Route: `POST rf/outbound/shipping/next-stop` — advance to next stop
- Route: `POST rf/outbound/shipping/current-stop` — which stop are we loading?

---

## GAP-5: Missing Pallet Loading Shortcut

**Manhattan Reference:** Scan pallet barcode → represents 50 cartons at once. One scan = multiple cartons loaded.  
**Current State:** `scanLpn` handles individual carton LPNs only. No bulk pallet scanning.  
**Impact:** Manual handling of palletized freight is slow. Operators scan 50 cartons individually when one pallet scan would suffice.

### Tasks

#### GAP-5.1: Add pallet LPN aggregation support
- **File:** `src/outbound/shipments/rf/shipping.controller.ts` — `scanLpn`
- If scanned LPN is type PALLET:
  - Find all child carton LPNs (via `lpn_relationships` or query)
  - Bulk-update all child LPNs: status → LOADED, load_id = current load
  - Increment loaded_cartons by child count
  - Return `{ palletLoaded: true, cartonCount: N, cartonIds: [...] }`

#### GAP-5.2: Add pallet RF endpoint (optional dedicated)
- Route: `POST rf/outbound/shipping/scan-pallet` — explicit pallet scan with confirmation

---

## GAP-6: Missing Trailer Capacity Validation

**Manhattan Reference:** Trailer has weight and volume limits. Overloading prevented.  
**Current State:** No capacity tracking or enforcement on trailers. Any number of cartons can be loaded.  
**Impact:** Overweight trailers cause safety issues, carrier rejections, and legal liability.

### Tasks

#### GAP-6.1: Add capacity fields to trailers/locations
- **File:** `prisma/schema.prisma` — `loading_docks` or new `trailers` table
- Add columns: `max_weight_kg`, `max_volume_cbm`, `max_pallets`, `max_cartons`

#### GAP-6.2: Add capacity validation to `scanLpn`
- **File:** `src/outbound/shipments/rf/shipping.controller.ts`
- Before confirming carton load:
  - Calculate current load weight/volume from loaded cartons
  - Add new carton weight/volume
  - If exceeds threshold: reject with `"OVER CAPACITY: Weight limit exceeded"`
  - Return remaining capacity on each scan

#### GAP-6.3: Add capacity check to `closeTrailer`
- Validate total load doesn't exceed trailer limits before allowing close

---

## GAP-7: Missing Carrier Handoff (Transfer of Custody)

**Manhattan Reference:** Critical legal/operational event — warehouse transfers custody to carrier. Confirms trailer is ready for departure.  
**Current State:** `departLoad` exists in LoadService but no RF endpoint. Handoff step not integrated into loading workflow.  
**Impact:** No formal record of when carrier took possession. Liability unclear if shipment goes missing.

### Tasks

#### GAP-7.1: Add carrier handoff to load departure
- **File:** `src/outbound/loads/load.service.ts`
- New method: `transferToCarrier(tenantId, loadId, carrierDriverName, carrierSignature?)`
  - Set load status → DEPARTED or IN_TRANSIT
  - Record handoff timestamp, driver name, signature
  - Generate BOL (Bill of Lading) data
  - Update all cartons: LOADED → SHIPPED

#### GAP-7.2: Add RF handoff endpoint
- **File:** `src/outbound/shipments/rf/shipping.controller.ts`
- Route: `POST rf/outbound/shipping/handoff` — record carrier handoff
  - Accept driver name, signature (or PIN)
  - Auto-generate BOL number if not provided

---

## GAP-8: Missing Manifest Generation Integration

**Manhattan Reference:** Manifesting runs on close to produce official shipping record (details, weight, carton count, tracking)  
**Current State:** `ShipmentService.generateManifest()` exists but is NOT called from any RF endpoint. Manifest is standalone, not integrated into shipping workflow.  
**Impact:** No manifest produced at time of shipping. Must be done manually/separately.

### Tasks

#### GAP-8.1: Integrate manifest into closeTrailer
- **File:** `src/outbound/shipments/rf/shipping.controller.ts` — `closeTrailer`
- After closing load: call `generateManifest(loadId)`
- Include manifest summary in response
- Optionally save manifest to `generated_manifests` table

#### GAP-8.2: Add RF manifest endpoint
- **File:** `src/outbound/shipments/rf/shipping.controller.ts`
- Route: `POST rf/outbound/shipping/manifest` — view/regenerate manifest

#### GAP-8.3: Create `generated_manifests` Prisma model
- **File:** `prisma/schema.prisma`
- Fields: `manifest_id`, `tenant_id`, `load_id`, `manifest_number`, `manifest_data_json`, `generated_at`, `generated_by`

---

## GAP-9: Missing "Close Shipment" as Separate Step

**Manhattan Reference:** Phase C Step 7 — "Close Shipment" is a separate step from closing the load. All cartons for a shipment must be loaded before the shipment can be closed.  
**Current State:** `closeTrailer` bulk-closes all shipments on the load. No individual shipment close.  
**Impact:** Cannot close individual shipments within a partially-loaded trailer. Load closure is all-or-nothing.

### Tasks

#### GAP-9.1: Add closeShipment endpoint
- **File:** `src/outbound/shipments/rf/shipping.controller.ts`
- Route: `POST rf/outbound/shipping/close-shipment` — close single shipment
  - Validate all cartons loaded
  - Set shipment status to SHIPPED (or CLOSED if not yet departed)
  - Update order status

#### GAP-9.2: Keep closeTrailer for bulk close
- `closeTrailer` iterates all shipments and calls `closeShipment` for each
- Allows both individual and bulk close

---

## Summary: Files to Create/Update

### New Files
| # | File | Purpose |
|---|------|---------|
| 1 | `src/outbound/staging/staging.service.ts` | Staging operations service |
| 2 | `src/outbound/staging/rf/staging.controller.ts` | RF staging endpoints |
| 3 | `src/outbound/staging/web/staging.controller.ts` | Web staging CRUD |
| 4 | `src/outbound/staging/staging.module.ts` | NestJS module |
| 5 | `src/outbound/shipments/web/shipping.controller.ts` | Web shipping CRUD |

### New Prisma Tables
| # | Table | Purpose |
|---|-------|---------|
| 1 | `staging_lanes` | Staging lane definitions and assignments |
| 2 | `load_stops` | Multi-stop load routing |
| 3 | `generated_manifests` | Manifest document history |
| 4 | `trailer_capacity_checks` | Audit log of capacity validations |

### Updated Prisma Tables
| # | Table | Changes |
|---|-------|---------|
| 1 | `loads` | Add multi_stop (bool), total_stops, current_stop_loading |
| 2 | `loading_docks` | Add max_weight_kg, max_volume_cbm, max_pallets |
| 3 | `outbound_shipments` | Add staging_lane_id, expected_carton_count |
| 4 | `license_plate_numbers` | Add parent_lpn_id (pallet→carton hierarchy), staging_lane_id |

### Updated Files
| # | File | Changes |
|---|------|---------|
| 1 | `src/outbound/shipments/rf/shipping.controller.ts` | Add 10+ new RF endpoints for staging, directed work, verification, multi-stop, pallet scanning, capacity, handoff, manifest, ship-close |
| 2 | `src/outbound/shipments/shipment.service.ts` | Add shipment verification, `closeShipment` |
| 3 | `src/outbound/loads/load.service.ts` | Add directed work, multi-stop sequencing, capacity validation, carrier handoff |
| 4 | `src/outbound/shipments/shipments.module.ts` | Register staging module |
| 5 | `src/outbound/outbound.module.ts` | Register new modules |
| 6 | `prisma/schema.prisma` | Add 4 tables, modify 4 tables |
| 7 | `src/common/casl/casl-ability.factory.ts` | Add CASL subjects: 'StagingLane', 'Manifest' |

### Complete RF Endpoints Summary (Current + New for Shipping)

#### Existing (3)
| Route | Purpose |
|-------|---------|
| `POST rf/outbound/shipping/start-load` | Start loading session at dock door |
| `POST rf/outbound/shipping/scan-lpn` | Scan carton LPN, load onto trailer |
| `POST rf/outbound/shipping/close-trailer` | Close and seal trailer |

#### New — Staging Phase (4)
| Route | Action | Purpose |
|-------|--------|---------|
| `POST rf/outbound/staging/get-next` | read | Get next staging task |
| `POST rf/outbound/staging/scan-carton` | read | Scan carton for staging |
| `POST rf/outbound/staging/confirm-lane` | update | Confirm staging lane |
| `POST rf/outbound/staging/my-tasks` | read | List assigned staging tasks |

#### New — Loading Phase (10)
| Route | Action | Purpose |
|-------|--------|---------|
| `POST rf/outbound/shipping/get-next` | read | Directed loading work |
| `POST rf/outbound/shipping/verify-shipment` | read | Verify all cartons loaded |
| `POST rf/outbound/shipping/verify-load` | read | Verify all shipments complete |
| `POST rf/outbound/shipping/close-shipment` | update | Close single shipment |
| `POST rf/outbound/shipping/scan-pallet` | update | Bulk-load pallet of cartons |
| `POST rf/outbound/shipping/current-stop` | read | Current multi-stop position |
| `POST rf/outbound/shipping/next-stop` | update | Advance to next stop |
| `POST rf/outbound/shipping/handoff` | update | Transfer custody to carrier |
| `POST rf/outbound/shipping/manifest` | read | View/generate manifest |
| `POST rf/outbound/shipping/capacity` | read | Check trailer capacity |

### Web Endpoints Added
| Route | Method | Purpose |
|-------|--------|---------|
| `/web/staging-lanes[/:id]` | POST/GET/PATCH | Staging lane CRUD |
| `/web/loads/:id/stops` | POST/GET/PATCH | Multi-stop configuration |
| `/web/manifests/:loadId` | GET | View manifest |
| `/web/shipments/:id/close` | POST | Close shipment from web |

---

## Priority & Effort

| Priority | Item | Effort |
|----------|------|--------|
| CRITICAL | GAP-1: Staging operations (entire phase) | Large |
| HIGH | GAP-3: Shipment verification | Medium |
| HIGH | GAP-2: Directed loading work | Small |
| MEDIUM | GAP-8: Manifest integration | Small |
| MEDIUM | GAP-6: Trailer capacity validation | Medium |
| MEDIUM | GAP-9: Individual shipment close | Small |
| MEDIUM | GAP-7: Carrier handoff | Small |
| LOW | GAP-4: Multi-stop sequencing | Large |
| LOW | GAP-5: Pallet loading shortcut | Medium |

---

## APPENDIX: Post-Verification Critical Missing Items

Verification identified **67 missing items** plus **31 partially covered**. The most critical are below:

### APP-SHIP-A: Missing Trailer Entity (Critical)

**Manhattan:** Trailer is a first-class entity: trailer_number, is_active, capacity (weight/volume/pallets), assigned_load_id, assigned_dock_id, status.  
**Current State:** NO `trailers` table in the plan. `loading_docks` is used as a proxy, conflating dock (location) with trailer (vehicle). This causes the ENTIRE trailer-scan validation chain to fail — you cannot scan a trailer barcode, validate it exists, validate it's assigned to the correct load, or detect wrong trailers.  
**Tasks to add:**
- Create `trailers` Prisma model: `trailer_id, tenant_id, trailer_number (unique per facility), facility_id, carrier_id, status (ARRIVED/AT_DOCK/LOADING/SEALED/DEPARTED), is_active, max_weight_kg, max_volume_cbm, max_pallets, assigned_load_id, assigned_dock_id, seal_number`
- Move capacity fields from `loading_docks` to `trailers` (capacity is a TRAILER attribute, not a DOCK attribute)
- Add `trailer_id` to loads (currently: load has no trailer assignment in plan)
- RF: `POST rf/outbound/shipping/scan-trailer` — scan trailer barcode, validate existence/active/assigned-to-load/assigned-to-dock
- **This is the single most impactful missing item in the entire shipping plan.**

### APP-SHIP-B: Full Carton-to-Trailer Validation Chain

**Manhattan:** Full relationship validation chain: Carton → Shipment → Load → Trailer. All 4 levels must be verified.  
**Current State:** Existing `scan-lpn` only validates LPN exists and is PACKED. No load assignment check. No trailer context.  
**Tasks to add:**
- In `scan-lpn`: validate ALL levels of the chain:
  1. Carton exists and status = STAGED (not PACKED — must go through staging)
  2. Carton assigned to a shipment (has shipment_id)
  3. Shipment assigned to the current load (shipment.load_id === current session load_id)
  4. Load assigned to the current trailer (load.trailer_id === current session trailer_id) — requires APP-SHIP-A
- If any check fails: return specific error ("CARTON NOT STAGED" / "WRONG LOAD" / "WRONG TRAILER")

### APP-SHIP-C: Load Confirmation Step (Loaded? Y/N)

**Manhattan:** After physical carton placement, operator must confirm "Loaded? Y/N" on RF device. This creates proof of loading.  
**Current State:** No confirmation step. `scan-lpn` processes immediately without operator confirmation.  
**Tasks to add:**
- Split `scan-lpn` into two phases: (1) validate + display, (2) confirm
- Phase 1 (`POST rf/outbound/shipping/validate-carton`): validate all chain levels, return carton info
- Phase 2 (`POST rf/outbound/shipping/confirm-load`): operator confirms "YES" → update LPN to LOADED, record loaded_at, loaded_by
- If operator scans next carton without confirming previous → auto-confirm previous (optional config)
- Create `carton_loading_confirmation` audit table: carton_id, load_id, loaded_by, loaded_at, confirmation_method (SCAN_CONFIRM / BULK_AUTO)

### APP-SHIP-D: Dedicated Shipping Audit Trail

**Manhattan:** Audit trail captures: Operator, Trailer, Door, Load, Shipment, Carton, Timestamp — proving what shipped, when, and by whom.  
**Current State:** Completely missing. No audit table anywhere in the plan.  
**Tasks to add:**
- Create `shipping_audit_log` table (append-only immutable log)
- Write audit events: CARTON_STAGED, STAGING_LANE_CONFIRMED, LOAD_ASSIGNED, TRAILER_ASSIGNED, CARTON_SCANNED_FOR_LOAD, CARTON_CONFIRMED_LOADED, SHIPMENT_VERIFIED, SHIPMENT_CLOSED, LOAD_CLOSED, TRAILER_SEALED, MANIFEST_GENERATED, CARRIER_HANDOFF, TRAILER_DEPARTED
- Each event records: event_type, entity_ids (carton/shipment/load/trailer/lane/door), operator_id, timestamp, snapshot_data (JSON of relevant state at time of event)
- Web: GET `/web/audit/shipping/:loadId` — full load shipment timeline
- Web: GET `/web/audit/carton/:cartonId` — full carton lifecycle from pack→ship

### APP-SHIP-E: Route Entity

**Manhattan:** Full hierarchy: Carton → Shipment → Load → Trailer → **Route**  
**Current State:** Route is completely absent. No route table. No route_id on loads. Route staging type has no target route to match against. Multi-stop loads inherently have a route but the route concept is missing.  
**Tasks to add:**
- Create `shipping_routes` table: route_id, tenant_id, route_code, description, origin_facility_id, is_active
- Create `route_stops` table: route_stop_id, route_id, stop_sequence, location_name, planned_arrival, planned_departure, carrier_id, is_active
- Add `route_id` to loads (optional — load may follow a predefined route or be custom)
- When load uses a route: auto-create load_stops from route_stops template
- `staging_lanes.lane_type = 'ROUTE'` should match against route_id

### APP-SHIP-F: Bill of Lading (BOL) Details

**Manhattan:** Transfer of custody generates BOL data. GAP-7.1 mentions BOL but gives no details.  
**Current State:** No BOL table. No BOL field specification. No BOL generation template.  
**Tasks to add:**
- Create `bill_of_lading` table: bol_id, load_id, bol_number (auto: BOL-{facility}-{timestamp}), carrier_id, vehicle_number, trailer_number, seal_number, total_weight_kg, total_volume_cbm, total_cartons, total_pallets, driver_name, driver_signature, generated_at, generated_by
- BOL data populated from Load + Trailer + aggregated carton/shipment data
- Method: `generateBol(tenantId, loadId)` — populate BOL from load context (already partially exists in LoadService)
- Store generated BOL as PDF (optional — at minimum store data)
- RF: `POST rf/outbound/shipping/bol` — view/download BOL

### APP-SHIP-G: Undo/Reverse Operations

**Manhattan:** Operators make mistakes. Systems need "undo" capability.  
**Current State:** No undo for: wrong carton loaded, wrong staging lane, wrong trailer.  
**Tasks to add:**
- RF: `POST rf/outbound/shipping/undo-load` — reverse last carton load (LOADED → STAGED, decrement load carton count)
- RF: `POST rf/outbound/staging/undo-stage` — reverse staging (STAGED → PACKED)
- RF: `POST rf/outbound/shipping/reassign-shipment` — move shipment from one load to another
- All undo operations require reason code + audit trail entry + supervisor authorization for certain levels

### APP-SHIP-H: Mixed-Route Staging Enforcement

**Manhattan:** "Avoid mixed-route staging." A staging lane assigned to Route A should reject cartons for Route B.  
**Current State:** No cross-validation of carton route/carrier against lane assignment.  
**Tasks to add:**
- In `moveToStagingLane`: if lane has `lane_type = CARRIER` and `assigned_carrier_id`, validate carton's shipment carrier matches
- If lane has `lane_type = ROUTE` and `assigned_route_id`, validate carton's load/shipment route matches
- If lane has `lane_type = DOOR` and `assigned_door_id`, validate carton's load dock door matches
- Reject with "WRONG STAGING LANE — This carton belongs to Route B, Lane assigned to Route A"

### APP-SHIP-I: Staging Lane Capacity / Limits

**Manhattan:** Staging lanes have physical limits. Multiple operators shouldn't overflow a lane.  
**Current State:** No staging lane capacity tracking.  
**Tasks to add:**
- Add `max_cartons`, `max_pallets`, `current_carton_count` to `staging_lanes`
- On `moveToStagingLane`: increment `current_carton_count`
- If count >= max_cartons: return `{ warning: "Lane Full", remaining: 0 }`
- On carton moved out (loaded): decrement count
- Web: GET `/web/staging-lanes/:id/capacity` — view lane utilization

### APP-SHIP-J: Individual Trailer Seal Handling

**Manhattan:** Trailer seal number is recorded when trailer is closed.  
**Current State:** Existing `close-trailer` API has `sealNumber` in the summary but plan didn't detail seal management.  
**Tasks to add:**
- Add `seal_number` to loads (already implied) and trailers (APP-SHIP-A)
- RF endpoint: `POST rf/outbound/shipping/seal-trailer` — record seal number + timestamp
- Validate seal number format (alphanumeric, no special chars)
- Seal becomes part of BOL and manifest

### APP-SHIP-K: RF In-Progress Query Endpoints

**Manhattan:** Operators need visibility: "Where is carton X?", "What's staged at lane Y?", "Is this load complete?"  
**Current State:** Plan has verify-shipment and verify-load. Missing several lookup queries.  
**Tasks to add:**
- RF: `POST rf/outbound/shipping/find-carton` — scan carton barcode, return: location status (PACKED/STAGED/LOADED/SHIPPED), current location (staging lane / load / trailer), shipment/order context
- RF: `POST rf/outbound/staging/lane-contents` — what cartons are staged at a lane?
- RF: `POST rf/outbound/shipping/load-summary` — load detail: N shipments, M cartons, stops, completion %, any exceptions
- RF: `POST rf/outbound/shipping/shipment-cartons` — list all cartons for a shipment with statuses

### APP-SHIP-L: Integration Hook — Packing → Staging Auto-Queue

**Manhattan:** "Stage immediately after packing." When packing completes, cartons should auto-appear in staging work queue.  
**Current State:** Staging is an independent RF flow. No connection from packing completion to staging work.  
**Tasks to add:**
- On `closeCarton` in PackingService: if carton closes successfully → create `staging_work_queue` entry (carton_id, status: PENDING_STAGE)
- On `getNextStagingWork`: pull from staging_work_queue (ordered by priority/creation_time)
- Update staging_work_queue entry status → ASSIGNED / STAGED / CANCELLED
- This creates a seamless pack → stage handoff

### APP-SHIP-M: Force-Close Authorization Mechanism

**Manhattan:** "Force Close" for partial loads requires supervisor authorization.  
**Current State:** GAP-3.2 mentions "Force Close (supervisor only)" but no authorization mechanism is described.  
**Tasks to add:**
- `closeTrailer` with `forceClose=true`: require supervisor_user_id + supervisor_pin
- Validate supervisor credentials against `users` table + role/permission check
- Create `force_close_authorizations` record (who authorized, why, which shipments were incomplete)
- RF endpoint: `POST rf/outbound/shipping/force-close` — supervisor-only endpoint

### APP-SHIP-N: Wrong-Truck Error Handling

**Manhattan:** When carton for Load A (assigned to TRAILER-A) is scanned at TRAILER-B → display "ERROR — Wrong Trailer".  
**Current State:** This validation cannot work without the Trailer entity (APP-SHIP-A).  
**Tasks to add (after APP-SHIP-A):**
- In `scan-lpn` / `validate-carton`: get carton's load.trailer_id
- Compare against current session's trailer_id  
- If mismatch: return `{ error: "WRONG TRAILER", carton_load: "LOAD-1002", carton_trailer: "TRAILER-A", current_trailer: "TRAILER-B" }`
- Log wrong-trailer attempts for fraud/error analysis

### APP-SHIP-O: Weight Tracking on Cartons for Capacity

**Manhattan:** Trailer capacity validation requires knowing carton weights.  
**Current State:** GAP-6.2 calculates load weight but where does individual carton weight come from? Plan adds no `weight_kg` or `volume_cbm` fields to LPNs.  
**Tasks to add:**
- Add `weight_kg` and `volume_cbm` fields to `license_plate_numbers` (for type=CARTON)
- Popolate carton weight from packing's weight capture (GAP-4 in Packing Plan)
- If packing didn't capture weight: calculate estimated weight from product weights + carton tare
- In `scan-lpn` capacity check: sum actual carton weights, not estimates
