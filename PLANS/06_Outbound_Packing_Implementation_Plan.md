# Outbound Packing — RF Implementation Plan

**Reference:** Manhattan_RF_Operations_Suite_v1 Parts 1-3  
**Existing Code:** `src/outbound/packing/` — RfPackingController (8 endpoints), PackingService (11 methods)  
**Status:** 60% Complete — station assignment, order scanning, item verification, basic pack, seal, close carton, and session management exist; missing directed work, cartonization engine, weight capture (scale), carton content verification, shortage handling, damage during packing, supervisor override, and packing slip generation  

---

## Summary of Manhattan Process

```
Assign Station → Get Pack Work → Scan Pick LPN (Tote) → Assign Carton
→ Nest Pick LPN into Carton → Verify Contents → Weight Capture (Scale)
→ Carton Close → Generate Shipping Label → Generate Packing Slip
→ [Multi-Carton: Cartonization determines cartons + item distribution]
→ [Shortage: Short Pack Exception] [Damage: Hold + Replace Pick]
→ [Supervisor Override] → All Cartons Packed → Shipment Ready
```

---

## GAP-1: Missing Directed Pack Work (Get Pack Work)

**Manhattan Reference:** Step 2 — Packer presses "Get Pack Work", system assigns next available packing task  
**Current State:** `scan-order` endpoint exists to assign order manually. No "get next work" endpoint. Operator must scan an order barcode or enter order number.  
**Impact:** No push-based work assignment. Operators decide which order to pack. No priority enforcement.

### Tasks

#### GAP-1.1: Add `getNextPackWork` method
- **File:** `src/outbound/packing/packing.service.ts`
- New method: `getNextPackWork(tenantId, facilityId, stationId, userId)`
  - Find highest-priority order with status PICKED, not yet assigned to a packing station
  - Auto-assign to the station/session
  - Return order details + associated Pick LPNs (totes)

#### GAP-1.2: Add RF endpoint
- **File:** `src/outbound/packing/rf/packing.controller.ts`
- Route: `POST rf/outbound/pack/get-next` — auto-assign next packing work
- Fall back to `scan-order` for manual assignment

---

## GAP-2: Missing Cartonization Engine

**Manhattan Reference:** Part 3 — System determines how many cartons needed, which carton type, which items go in which carton. Inputs: item dimensions, weight, hazmat, carrier rules. Customer receives "1 of 3, 2 of 3, 3 of 3" tracking.  
**Current State:** `packItems` creates a single container if `containerCode` is provided. `closeCarton` closes one carton. No cartonization logic.  
**Impact:** For multi-carton orders, packers must manually decide carton splitting. No weight/volume enforcement. No "3 of 5" tracking.

### Tasks

#### GAP-2.1: Create `cartonization_rules` Prisma model
- **File:** `prisma/schema.prisma`
- Fields: `rule_id`, `tenant_id`, `rule_name`, `priority`, `conditions_json` (max weight, max volume, max items, hazmat restrictions, carrier restrictions), `carton_type_id`, `is_active`

#### GAP-2.2: Create Cartonization Engine Service
- **File:** `src/outbound/packing/cartonization.service.ts`
- Method: `calculateCartons(tenantId, orderId)`
  - Fetch all picked items + quantities + product dimensions/weights
  - Apply cartonization rules (evaluate by priority)
  - Determine number of cartons, carton types, which items per carton
  - Generate `cartonIndex` (1 of N, 2 of N...)
  - Return `{ cartons: [{ cartonTypeId, index, totalInOrder, items: [...] }] }`

#### GAP-2.3: Integrate cartonization into pack flow
- **File:** `src/outbound/packing/packing.service.ts`
- On `startSession` or `getNextPackWork`: run cartonization
- Display "Pack Carton 1 of 3" on RF screen
- Store carton plan in `packing_carton_plan` table

#### GAP-2.4: Create `packing_carton_plan` Prisma model
- **File:** `prisma/schema.prisma`
- Fields: `plan_id`, `order_id`, `carton_index`, `total_cartons`, `carton_type_id`, `items_json` (planned items array), `status` (PLANNED/IN_PROGRESS/PACKED)

#### GAP-2.5: Web cartonization rule endpoints
- **File:** `src/outbound/packing/web/cartonization.controller.ts`
- CRUD: POST/GET/PATCH `/web/cartonization-rules[/:id]`

---

## GAP-3: Missing Carton Content Verification

**Manhattan Reference:** Step 6 — "Expected: SKU-A Qty 5, SKU-B Qty 3" — system compares expected vs actual packed  
**Current State:** `verifyProduct` checks if a product belongs to an order but doesn't compare total expected vs total packed per carton.  
**Impact:** Missing item or extra item not detected until after carton close.

### Tasks

#### GAP-3.1: Add content verification step
- **File:** `src/outbound/packing/packing.service.ts`
- New method: `verifyCartonContents(tenantId, cartonLpnId, orderId)`
  - Compare items packed into this carton vs cartonization plan
  - Return: `{ isComplete, missing: [...], extra: [...], matched: [...] }`

#### GAP-3.2: Add RF verification endpoint
- **File:** `src/outbound/packing/rf/packing.controller.ts`
- Route: `POST rf/outbound/pack/verify-carton` — verify contents before close
- If not complete: show "Missing: SKU-B Qty 2" on RF screen
- Include mandatory verification before `close-carton` if configured

---

## GAP-4: Missing Weight Capture (Scale Integration)

**Manhattan Reference:** Step 7 — "Place Carton On Scale → Weight: 5.2 KG" — captures actual weight for carrier billing and label accuracy  
**Current State:** `packItems` accepts `weight` as optional DTO parameter. No scale integration. Manual weight entry only.  
**Impact:** Inaccurate shipping weights → carrier billing discrepancies → rejected labels. No weight tolerance validation.

### Tasks

#### GAP-4.1: Create scale integration interface
- **File:** `src/outbound/packing/scale-integration.service.ts`
- Define abstract `ScaleProvider` interface: `getWeight(): Promise<{ weightKg, isStable, unit, timestamp }>`
- Implement dummy provider for testing; create plugin for common scales (Mettler Toledo, etc.)
- Add weight capture endpoint that polls the scale

#### GAP-4.2: Add RF weight capture endpoint
- **File:** `src/outbound/packing/rf/packing.controller.ts`
- Route: `POST rf/outbound/pack/capture-weight` — RF polls scale, returns weight reading
- Route: `POST rf/outbound/pack/confirm-weight` — operator confirms weight reading

#### GAP-4.3: Add weight tolerance validation
- **File:** `src/outbound/packing/packing.service.ts`
- After weight captured: compare actual weight against expected (sum of product weights + carton tare)
- If outside tolerance (e.g., ±10%): flag "Weight Mismatch" → supervisor review
- Record weight in packing slip / carton record

---

## GAP-5: Missing Short Pack / Partial Packing Handling

**Manhattan Reference:** Part 3 — "Expected: 10 | Packed: 8 | Continue?" — shortages discovered at packing create Short Pack Exception requiring supervisor review  
**Current State:** No shortage handling. `packItems` packs what's provided. No comparison against expected order quantity.  
**Impact:** Orders shipped short without exception tracking. No supervisor oversight for shortages.

### Tasks

#### GAP-5.1: Add shortage detection in packItems
- **File:** `src/outbound/packing/packing.service.ts`
- Compare packed quantities against order line quantities
- If packed < ordered: flag as short pack
- Create `ShortPackException` record with missing items, quantities, reason

#### GAP-5.2: Create short pack exception RF flow
- **File:** `src/outbound/packing/rf/packing.controller.ts`
- Route: `POST rf/outbound/pack/report-shortage` — operator reports shortage with reason
- After shortage detected: require supervisor approval before close-carton

#### GAP-5.3: Create `packing_exceptions` Prisma model
- **File:** `prisma/schema.prisma`
- Fields: `exception_id`, `order_id`, `carton_id`, `exception_type` (SHORTAGE/DAMAGE/WEIGHT_MISMATCH/WRONG_ITEM), `product_id`, `expected_qty`, `packed_qty`, `reason_code`, `status` (OPEN/SUPERVISOR_REVIEW/RESOLVED), `resolved_by`, `resolved_at`

---

## GAP-6: Missing Damage During Packing Handling

**Manhattan Reference:** Damaged inventory found during packing → Inventory Hold + Damage Record + Replacement Pick Request  
**Current State:** No damage handling during packing.  
**Impact:** Damaged items shipped or manually discarded with no audit trail.

### Tasks

#### GAP-6.1: Add damage reporting to pack flow
- **File:** `src/outbound/packing/packing.service.ts`
- New method: `reportPackingDamage(tenantId, sessionId, productId, quantity, damageCodeId)`
  - Remove damaged qty from cartonized plan
  - Create `quality_holds` record for damaged product
  - Create `packing_exceptions` record type=DAMAGE
  - Auto-create replacement pick task for remaining order quantity
  - Update order line: remove damaged qty from packed total

#### GAP-6.2: Add RF damage endpoint
- **File:** `src/outbound/packing/rf/packing.controller.ts`
- Route: `POST rf/outbound/pack/report-damage` — record damage during packing

---

## GAP-7: Missing Supervisor Override Workflow

**Manhattan Reference:** Supervisor can approve quantity variance, alternate carton type, and shipment release  
**Current State:** No supervisor override anywhere in packing.  
**Impact:** Cannot handle exceptions without manual database fixes.

### Tasks

#### GAP-7.1: Add supervisor approval endpoints
- **File:** `src/outbound/packing/packing.service.ts`
- New methods: `getPendingExceptions`, `approveException`, `rejectException`
- **File:** `src/outbound/packing/rf/packing.controller.ts`
- Route: `POST rf/outbound/pack/pending-exceptions` — list exceptions needing supervisor
- Route: `POST rf/outbound/pack/:exceptionId/approve` — approve
- Route: `POST rf/outbound/pack/:exceptionId/reject` — reject

#### GAP-7.2: Web supervisor endpoints
- **File:** `src/outbound/packing/web/packing.controller.ts`
- Same endpoints for web interface

---

## GAP-8: Missing Packing Slip Generation

**Manhattan Reference:** Step 10 — Generate packing slip document (order content details, not the carrier label)  
**Current State:** `closeCarton` generates a shipping LPN and ZPL label. No packing slip for end customer.  
**Impact:** Customer receives carton with no content documentation.

### Tasks

#### GAP-8.1: Add packing slip generation to closeCarton
- **File:** `src/outbound/packing/packing.service.ts`
- Generate packing slip data: order number, items with descriptions/quantities, prices (if configured), barcodes, customer address
- Return packing slip data alongside label data
- Option: create `packing_slip_documents` table for PDF storage

#### GAP-8.2: Add RF packing slip endpoint
- **File:** `src/outbound/packing/rf/packing.controller.ts`
- Route: `POST rf/outbound/pack/print-packing-slip` — print packing slip for current carton

#### GAP-8.3: Web packing slip endpoints
- **File:** `src/outbound/packing/web/packing.controller.ts`
- Route: `GET /web/packing-slips/:orderId` — view/print packing slip from web

---

## GAP-9: Missing LPN Nesting (Tote → Carton Hierarchy)

**Manhattan Reference:** Step 5 — "Nest Pick LPN Into Carton" — inventory ownership moves from Pick LPN (tote) → Shipping Carton LPN. One carton can nest multiple totes.  
**Current State:** `packItems` creates container and items but doesn't explicitly transfer ownership from Pick LPN to Carton LPN. `closeCarton` creates carton LPN but without tote nesting.  
**Impact:** Inventory traceability gap. System can't tell which tote was consumed by which carton.

### Tasks

#### GAP-9.1: Implement LPN nesting in packItems
- **File:** `src/outbound/packing/packing.service.ts`
- Accept `pickLpnIds: bigint[]` in pack DTO
- When items are packed: create `lpn_relationships` (parent carton LPN → child pick LPNs)
- Update pick LPN status: `PICKED → NESTED`
- Update carton LPN status: `CREATED → OPEN`

#### GAP-9.2: Enforce tote consumption on close-carton
- **File:** `src/outbound/packing/packing.service.ts` — `closeCarton()`
- Only close carton if all pick LPNs for that order are nested
- On close: update nested pick LPNs status: `NESTED → CONSUMED`

---

## Summary: Files to Create/Update

### New Files
| # | File | Purpose |
|---|------|---------|
| 1 | `src/outbound/packing/cartonization.service.ts` | Cartonization engine |
| 2 | `src/outbound/packing/scale-integration.service.ts` | Scale hardware integration |
| 3 | `src/outbound/packing/web/cartonization.controller.ts` | Web cartonization rule CRUD |
| 4 | `src/outbound/packing/web/packing.controller.ts` | Web packing CRUD + supervisor review |

### New Prisma Tables
| # | Table | Purpose |
|---|-------|---------|
| 1 | `cartonization_rules` | Cartonization rules (per-facility) |
| 2 | `packing_carton_plan` | Cartonization output per order |
| 3 | `packing_exceptions` | Shortage/damage/weight exceptions |
| 4 | `lpn_relationships` | Parent-child LPN hierarchy (tote → carton) |
| 5 | `packing_slip_documents` | Generated packing slips |

### Updated Prisma Tables
| # | Table | Changes |
|---|-------|---------|
| 1 | `packing_sessions` | Add planned_cartons, completed_cartons, exceptions_count |
| 2 | `packing_containers` | Add carton_index, total_cartons |
| 3 | `license_plate_numbers` | Add parent_lpn_id (for hierarchy) |

### Updated Files
| # | File | Changes |
|---|------|---------|
| 1 | `src/outbound/packing/packing.service.ts` | Add getNextPackWork, cartonization integration, content verification, weight capture, shortage handling, damage handling, supervisor override, packing slip generation, LPN nesting |
| 2 | `src/outbound/packing/rf/packing.controller.ts` | Add 10+ new RF endpoints |
| 3 | `src/outbound/packing/packing.module.ts` | Register new services |
| 4 | `prisma/schema.prisma` | Add 5 tables, modify 3 tables |
| 5 | `src/common/casl/casl-ability.factory.ts` | Add CASL subjects: 'CartonizationRule', 'PackingException' |

### RF Endpoints Added
| Route | Action | Purpose |
|-------|--------|---------|
| `POST rf/outbound/pack/get-next` | read | Directed pack work assignment |
| `POST rf/outbound/pack/verify-carton` | read | Verify carton contents before close |
| `POST rf/outbound/pack/capture-weight` | read | Poll scale for weight |
| `POST rf/outbound/pack/confirm-weight` | update | Confirm weight reading |
| `POST rf/outbound/pack/report-shortage` | update | Report short pack |
| `POST rf/outbound/pack/report-damage` | update | Report damage during packing |
| `POST rf/outbound/pack/pending-exceptions` | read | List pending supervisor exceptions |
| `POST rf/outbound/pack/:exceptionId/approve` | update | Supervisor approve exception |
| `POST rf/outbound/pack/:exceptionId/reject` | update | Supervisor reject exception |
| `POST rf/outbound/pack/print-packing-slip` | read | Print packing slip |
| `POST rf/outbound/pack/nest-lpn` | update | Nest pick LPN into carton |

### Web Endpoints Added
| Route | Method | Purpose |
|-------|--------|---------|
| `/web/cartonization-rules[/:id]` | POST/GET/PATCH | Cartonization rule CRUD |
| `/web/packing-sessions[/:id]` | POST/GET/PATCH | Session CRUD |
| `/web/packing-exceptions[/:id]` | GET/PATCH | View/resolve exceptions |
| `/web/packing-slips/:orderId` | GET | View/print packing slip |

---

## Priority & Effort

| Priority | Item | Effort |
|----------|------|--------|
| HIGH | GAP-2: Cartonization engine | Large |
| HIGH | GAP-9: LPN nesting (tote→carton hierarchy) | Medium |
| MEDIUM | GAP-1: Directed pack work | Small |
| MEDIUM | GAP-3: Carton content verification | Medium |
| MEDIUM | GAP-5: Short pack handling | Medium |
| MEDIUM | GAP-6: Damage during packing | Medium |
| MEDIUM | GAP-7: Supervisor override | Medium |
| LOW | GAP-4: Scale weight capture | Medium |
| LOW | GAP-8: Packing slip generation | Small |

---

## APPENDIX: Post-Verification Critical Missing Items

### APP-PACK-A: Shipment Release Prevention (All Cartons Must Be Packed)

**Manhattan Best Practice #5:** "Prevent shipment release until all cartons are packed." Shipment must NOT transition to READY_FOR_SHIPMENT before all planned cartons are packed.  
**Current State:** No shipment status transition logic in the packing plan. No guard preventing status advancement.  
**Tasks to add:**
- On carton close: check if this is the last planned carton for the order
- If last: set shipment status to READY_FOR_SHIPMENT
- If not last: keep shipment in PACKING status
- Add `closeShipment` guard: validate all cartons for shipment are PACKED before allowing SHIPPED transition
- Web endpoint: GET `/web/shipments/:id/packing-status` — which cartons are packed vs pending

### APP-PACK-B: Customer Preferences as Cartonization Input

**Manhattan:** Cartonization evaluates customer preferences alongside item dimensions, weight, hazmat rules, carrier rules.  
**Current State:** `cartonization_rules.conditions_json` lists max weight, max volume, max items, hazmat, carrier — NO customer preferences.  
**Tasks to add:**
- Add `customer_cartonization_preferences` table (customer_id, preferred_carton_type, max_cartons_per_shipment, combine_items, signature_required_cartons, gift_wrap_cartons)
- In cartonization engine: apply customer-specific preferences AFTER carrier/hazmat rules
- If customer prefers "all items in one carton" → consolidate if possible
- If customer requires "separate cartons for fragile and non-fragile" → split accordingly

### APP-PACK-C: Supervisor Approve Alternate Carton Type

**Manhattan:** Supervisor can override cartonization's recommended carton type (e.g., "recommended Large Box, use Medium Box instead").  
**Current State:** GAP-7 provides generic exception approval. No carton-type-override logic. `packing_exceptions` table has no CARTON_TYPE_OVERRIDE exception type.  
**Tasks to add:**
- Add `CARTON_TYPE_OVERRIDE` to `packing_exceptions.exception_type`
- Method: `requestCartonOverride(tenantId, cartonPlanId, requestedCartonTypeId, reason)` — create exception
- RF endpoint: `POST rf/outbound/pack/request-carton-override` — operator requests alternate carton
- Supervisor approve: validate that requested carton type can physically hold planned items (re-run cartonization check)
- Record override reason per audit requirement

### APP-PACK-D: Wrong Tote / LPN Validation (Tote-to-Station Assignment)

**Manhattan:** Tote must be assigned to the packer's specific packing station before it can be packed. Wrong tote detected with "Expected: TOTE-001 / Scanned: TOTE-999" error display.  
**Current State:** verifyProduct checks if product is on the order, but does NOT validate that the scanned tote LPN is assigned to the current packing station/session.  
**Tasks to add:**
- In `verifyProduct` or new `scanToteForPacking`: validate scanned LPN is assigned to current packing session
- If mismatch: return `{ error: "WRONG LPN", expected: "TOTE-001", scanned: "TOTE-999" }`
- Add `assigned_lpn_ids` to packing_sessions (list of LPNS assigned to this session)
- On `getNextPackWork`: populate assigned_lpn_ids with order's pick LPNs

### APP-PACK-E: Tote-to-Station Assignment During Directed Work

**Manhattan:** When getNextPackWork assigns an order, the associated Pick LPNs (totes) should also be "checked out" to the station.  
**Current State:** GAP-1 covers order assignment but doesn't assign totes to stations.  
**Tasks to add:**
- On `getNextPackWork`: query all PICKED LPNs for the assigned order
- Update LPNs: set `current_station_id`, `checked_out_to_user_id`, `checked_out_at`
- In `scan-item` / `packItems`: validate scanned LPN's `current_station_id` matches session's station
- On `completeSession`: clear station assignment from LPNs

### APP-PACK-F: Damage Type Reference Table

**Manhattan:** Structured damage codes for packing (Broken Packaging, Crushed Carton, Leaking Product).  
**Current State:** GAP-6.1 accepts `damageCodeId` but no `damage_codes` table definition for packing-specific damage types.  
**Tasks to add:**
- Create `packing_damage_codes` table (similar to receiving damage codes but packing-specific)
- Seed standard types: BROKEN_PACKAGING, CRUSHED_CARTON, LEAKING_PRODUCT, MISSING_ITEM, WRONG_ITEM, LABEL_DAMAGE
- RF endpoint: `POST rf/outbound/pack/damage-codes` — list packing-specific damage codes

### APP-PACK-G: Quality Feedback Loop (Packing → Picking)

**Manhattan:** "Most shipping complaints originate from packing errors, not picking errors." Packing should feed back errors to picking for systemic correction.  
**Current State:** No feedback loop mentioned in the plan.  
**Tasks to add:**
- When `WRONG_ITEM` exception is created: log the pick task ID that put this item into the tote
- Increment `pick_task.error_count` for the picker's quality metrics
- Web: GET `/web/reports/picking-quality` — pick error rate by operator, by product, by location
- If same location has repeated wrong-item issues → auto-create cycle count for that location

### APP-PACK-H: Carrier API Integration (Manifesting / Tracking Number)

**Manhattan:** Carrier label includes tracking number, destination address, service level. Manifest runs to notify carrier.  
**Current State:** CloseCarton generates ZPL label string (hardcoded stub). No real carrier API call. No tracking number assignment from carrier.  
**Tasks to add:**
- Create `carrier_api_integration` interface (UPS, FedEx, DHL, USPS)
- Method: `requestTrackingNumber(tenantId, shipmentId, carrierId)` — call carrier API
- On closeCarton: call carrier API to get tracking number → store on carton LPN
- On manifest: notify carrier of shipment
- Web: POST/GET `/web/carrier-integrations` — configure carrier API keys

### APP-PACK-I: Station-to-Scale Device Mapping

**Manhattan:** Scale is physically attached to the packing station. Weight capture must know which scale to poll.  
**Current State:** GAP-4 covers scale integration but not station-to-scale device mapping configuration.  
**Tasks to add:**
- Add `scale_device_id` and `scale_device_type` to `packing_stations`
- Add `scale_device_config` table (device_id, device_type: METTLER_TOLEDO / GENERIC_USB / DUMMY, connection_string, polling_interval_ms)
- On RF `capture-weight`: query station's scale device → poll that device
- Web: POST/GET `/web/packing-stations/:id/scale` — configure station scale
