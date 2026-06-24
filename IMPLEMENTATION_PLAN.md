# Enterprise WMS — Implementation Plan

> **Context**: 84 existing Prisma models, 48+ existing API controllers (web + RF), 11 fully implemented P2 modules.  
> **Goal**: Fill remaining gaps from the reference Enterprise WMS schema (80 tables in SQL comparison) while avoiding duplicates with existing implementations.  
> **Format**: Each phase is a self-contained prompt ready to execute.

---

## HOW TO USE THIS PLAN

Each phase is an implementation prompt. Execute them **in order** — later phases depend on earlier ones.  
Each prompt specifies:
1. **Prisma changes** — models, enums, columns to add/modify
2. **NestJS module** — new or extension, with controller/service/DTO structure
3. **API endpoints** — exact HTTP method + route path
4. **Existing patterns to follow** — links to sibling code for consistency

---

## PHASE 0: Prisma Schema & Column Enhancements (Foundation)

**Why first**: These add columns to existing tables that downstream phases depend on.

### Task: Enhance existing Prisma models with missing columns

#### Changes to `prisma/schema.prisma`:

```prisma
// ── Add to FacilityType enum ──
enum FacilityType {
  WAREHOUSE           @map("WAREHOUSE")
  DISTRIBUTION_CENTER @map("DISTRIBUTION_CENTER")
  CROSS_DOCK          @map("CROSS_DOCK")
  FULFILLMENT_CENTER  @map("FULFILLMENT_CENTER")
  MANUFACTURING_PLANT @map("MANUFACTURING_PLANT")  // NEW
  RETAIL_STORE        @map("RETAIL_STORE")          // NEW
  COLD_STORAGE        @map("COLD_STORAGE")          // NEW
  HAZMAT_FACILITY     @map("HAZMAT_FACILITY")       // NEW
  STORAGE_FACILITY    @map("STORAGE_FACILITY")       // NEW
}

// ── Add to ZoneType enum ──
enum ZoneType {
  BULK        @map("BULK")
  PICKING     @map("PICKING")
  RECEIVING   @map("RECEIVING")
  SHIPPING    @map("SHIPPING")
  PACKING     @map("PACKING")
  STAGING     @map("STAGING")
  QC          @map("QC")
  HOLD        @map("HOLD")
  YARD        @map("YARD")
  RACK        @map("RACK")         // NEW
  COLD_STORAGE @map("COLD_STORAGE") // NEW
  HAZMAT      @map("HAZMAT")       // NEW
  QUALITY_HOLD @map("QUALITY_HOLD") // NEW
  DAMAGE      @map("DAMAGE")       // NEW
  TEMPORARY   @map("TEMPORARY")    // NEW
  RETURNS     @map("RETURNS")      // NEW
}

// ── Add LocationType value ──
enum LocationType {
  PALLET      @map("PALLET")
  CASE        @map("CASE")
  EACH        @map("EACH")
  FLOOR       @map("FLOOR")
  STAGING     @map("STAGING")
  DOCK        @map("DOCK")
  TEMP        @map("TEMP")
  SPECIALIZED @map("SPECIALIZED")  // NEW
}

// ── Add remaining TransactionTypes ──
enum TransactionType {
  // ... existing values ...
  ISSUE       @map("ISSUE")        // NEW
  RETURN      @map("RETURN")       // NEW
  WRITE_OFF   @map("WRITE_OFF")    // NEW
}

// ── Add remaining HoldType values ──
enum HoldType {
  // ... existing ...
  INVESTIGATION @map("INVESTIGATION") // NEW
  VENDOR_RETURN @map("VENDOR_RETURN") // NEW
  RECALL        @map("RECALL")        // NEW
}

// ── Add HoldStatus value ──
enum HoldStatus {
  ACTIVE      @map("ACTIVE")
  RELEASED    @map("RELEASED")
  EXPIRED     @map("EXPIRED")
  SUPERSEDED  @map("SUPERSEDED")  // NEW
}

// ── Add LpnStatus values ──
enum LpnStatus {
  RECEIVED        @map("RECEIVED")
  IN_STAGING      @map("IN_STAGING")
  IN_QC           @map("IN_QC")
  PUTAWAY_PENDING @map("PUTAWAY_PENDING")
  STORED          @map("STORED")
  QUARANTINED     @map("QUARANTINED")
  CONSUMED        @map("CONSUMED")
  DISPOSED        @map("DISPOSED")
  NESTED          @map("NESTED")
  IN_TRANSIT      @map("IN_TRANSIT")      // NEW
  ALLOCATED       @map("ALLOCATED")       // NEW
  PICK_PENDING    @map("PICK_PENDING")    // NEW
  PICKED          @map("PICKED")          // NEW
  PACKED          @map("PACKED")          // NEW
  STAGED          @map("STAGED")          // NEW
  LOADED          @map("LOADED")          // NEW
  SHIPPED         @map("SHIPPED")         // NEW
}

// ── Add columns to WarehouseFacility ──
model WarehouseFacility {
  // ... existing fields ...
  addressLine1  String?  @map("address_line_1") @db.VarChar(255)   // NEW
  addressLine2  String?  @map("address_line_2") @db.VarChar(255)   // NEW
  city          String?  @map("city") @db.VarChar(100)              // NEW
  state         String?  @map("state") @db.VarChar(100)             // NEW
  postalCode    String?  @map("postal_code") @db.VarChar(20)        // NEW
  country       String?  @map("country") @db.VarChar(100)           // NEW
  contactName   String?  @map("contact_name") @db.VarChar(255)      // NEW
  contactEmail  String?  @map("contact_email") @db.VarChar(255)     // NEW
  contactPhone  String?  @map("contact_phone") @db.VarChar(50)      // NEW
  timezoneName  String?  @default("UTC") @map("timezone_name") @db.VarChar(50) // NEW
  description   String?  @map("description") @db.Text               // NEW
}

// ── Add columns to WarehouseZone ──
model WarehouseZone {
  // ... existing fields ...
  description         String? @map("description") @db.Text      // NEW
  configurationJson   Json?   @map("configuration_json") @db.Json // NEW
  layoutCoordinates   Json?   @map("layout_coordinates") @db.Json // NEW
  zoneColorHex        String? @map("zone_color_hex") @db.VarChar(7) // NEW
}

// ── Add columns to StorageLocation ──
model StorageLocation {
  // ... existing fields ...
  length                Float?   @map("length") @db.Real            // NEW
  width                 Float?   @map("width") @db.Real             // NEW
  height                Float?   @map("height") @db.Real            // NEW
  maxWeight             Float?   @map("max_weight") @db.Real        // NEW
  maxVolume             Float?   @map("max_volume") @db.Real        // NEW
  isReserved            Boolean  @default(false) @map("is_reserved") // NEW
  blockReason           String?  @map("block_reason") @db.Text      // NEW
  pickSequenceNumber    Int?     @map("pick_sequence_number")       // NEW
  travelDistanceFromDock Float?  @map("travel_distance_from_dock") @db.Real // NEW
  lastPickedAt          DateTime? @map("last_picked_at") @db.Timestamptz // NEW
  barcodeValue          String?  @map("barcode_value") @db.VarChar(200) // NEW
  clientId              String?  @map("client_id") @db.Uuid          // NEW
}

// ── Add columns to Product ──
model Product {
  // ... existing fields ...
  productType         String?  @map("product_type") @db.VarChar(50)    // NEW
  weight              Float?   @map("weight") @db.Real                 // NEW
  length              Float?   @map("length") @db.Real                 // NEW
  width               Float?   @map("width") @db.Real                  // NEW
  height              Float?   @map("height") @db.Real                 // NEW
  volume              Float?   @map("volume") @db.Real                 // NEW
  unitWeight          Float?   @map("unit_weight") @db.Real            // NEW
  storageRequirements String?  @map("storage_requirements") @db.VarChar(100) // NEW
  hazardousClass      String?  @map("hazardous_class") @db.VarChar(50) // NEW
  storageConditions   String?  @map("storage_conditions") @db.VarChar(100) // NEW
  imageUrl            String?  @map("image_url") @db.VarChar(500)      // NEW
  manufacturer        String?  @map("manufacturer") @db.VarChar(255)   // NEW
  countryOfOrigin     String?  @map("country_of_origin") @db.VarChar(100) // NEW
}

// ── Add columns to SalesOrder ──
model SalesOrder {
  // ... existing fields ...
  clientId            String?   @map("client_id") @db.Uuid             // NEW
  orderDate           DateTime? @map("order_date") @db.Timestamptz     // NEW
  currencyCode        String?   @default("USD") @map("currency_code") @db.VarChar(3) // NEW
  totalOrderValue     Decimal?  @map("total_order_value") @db.Decimal(14,2) // NEW
  confirmedDate       DateTime? @map("confirmed_date") @db.Timestamptz // NEW
  shippedDate         DateTime? @map("shipped_date") @db.Timestamptz   // NEW
  deliveredDate       DateTime? @map("delivered_date") @db.Timestamptz // NEW
}

// ── Add column to UnitOfMeasure ──
model UnitOfMeasure {
  // ... existing fields ...
  description String? @map("description") @db.VarChar(255)  // NEW
}
```

#### Files to modify:
- `prisma/schema.prisma`

#### How to verify:
- `pnpm run build` succeeds
- `npx prisma generate` runs clean
- Migration created cleanly

---

## PHASE 1: Master Data — Customer & Client Facility Assignments

**Why first**: Customers and client-facility mappings are referenced by orders, shipments, and billing.

### Task: Create Customer model + ClientFacilityAssignment model + APIs

#### New Prisma models:

```prisma
model Customer {
  id              String             @id @default(uuid()) @db.Uuid
  tenantId        String             @map("tenant_id") @db.Uuid
  customerCode    String             @map("customer_code") @db.VarChar(50)
  name            String             @db.VarChar(255)
  customerType    String?            @map("customer_type") @db.VarChar(50)
  primaryContactName  String?        @map("primary_contact_name") @db.VarChar(255)
  primaryEmail    String?            @map("primary_email") @db.VarChar(255)
  primaryPhone    String?            @map("primary_phone") @db.VarChar(50)
  billingAddressLine1 String?        @map("billing_address_line_1") @db.VarChar(255)
  billingAddressLine2 String?        @map("billing_address_line_2") @db.VarChar(255)
  billingCity     String?            @map("billing_city") @db.VarChar(100)
  billingState    String?            @map("billing_state") @db.VarChar(100)
  billingPostalCode String?          @map("billing_postal_code") @db.VarChar(20)
  billingCountry  String?            @map("billing_country") @db.VarChar(100)
  shippingAddressLine1 String?       @map("shipping_address_line_1") @db.VarChar(255)
  shippingAddressLine2 String?       @map("shipping_address_line_2") @db.VarChar(255)
  shippingCity    String?            @map("shipping_city") @db.VarChar(100)
  shippingState   String?            @map("shipping_state") @db.VarChar(100)
  shippingPostalCode String?         @map("shipping_postal_code") @db.VarChar(20)
  shippingCountry String?            @map("shipping_country") @db.VarChar(100)
  isActive        Boolean            @default(true) @map("is_active")
  createdAt       DateTime           @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime           @updatedAt @map("updated_at") @db.Timestamptz

  @@unique([tenantId, customerCode], name: "customers_code_uq")
  @@index([tenantId, isActive], name: "idx_cust_tenant_active")
  @@schema("multitenant")
  @@map("customers")
}

model ClientFacilityAssignment {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  clientId    String   @map("client_id") @db.Uuid
  facilityId  String   @map("facility_id") @db.Uuid
  isActive    Boolean  @default(true) @map("is_active")
  effectiveAt DateTime @default(now()) @map("effective_at") @db.Timestamptz
  expiresAt   DateTime? @map("expires_at") @db.Timestamptz
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz

  @@unique([tenantId, clientId, facilityId], name: "client_facility_assignments_uq")
  @@index([tenantId, facilityId], name: "idx_cfa_facility")
  @@schema("multitenant")
  @@map("client_facility_assignments")
}
```

#### New module: `src/master-data/customers/`
- `customers.module.ts` — registers controller + service
- `customers.service.ts` — CRUD with duplicate code check
- `web/customers.controller.ts` — web API
- `dtos/create-customer.dto.ts`, `update-customer.dto.ts`, `list-customer.dto.ts`

#### Extend `src/master-data/clients/`:
- Add `ClientFacilityAssignment` CRUD service + controller

#### API endpoints:

**Customers:**
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/web/customers` | Create customer |
| GET | `/web/customers` | List (paginated, filterable by `isActive`) |
| GET | `/web/customers/:id` | Get by ID |
| PATCH | `/web/customers/:id` | Update |
| DELETE | `/web/customers/:id` | Soft-delete (set isActive=false) |

**Client-Facility Assignments:**
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/web/client-facility-assignments` | Assign client to facility |
| GET | `/web/client-facility-assignments` | List (filter by `clientId`, `facilityId`) |
| GET | `/web/client-facility-assignments/:id` | Get by ID |
| PATCH | `/web/client-facility-assignments/:id` | Update |
| DELETE | `/web/client-facility-assignments/:id` | Remove assignment |

#### Pattern to follow:
- `src/master-data/clients/client.module.ts` for module structure
- `src/master-data/clients/client.service.ts` for CRUD pattern
- Same DTO validation approach with `class-validator` decorators

#### Also update `SalesOrder` to reference `Customer`:
- Add `customerId` field to SalesOrder model (already added in Phase 0)
- Create migration, update order creation DTO to accept `customerId`

---

## PHASE 2: Inventory — Allocation Rules Engine

**Why**: Allocation rules define how inventory is automatically assigned to orders — core WMS intelligence.

### Task: Create inventory allocation rules models + APIs

#### New Prisma models:

```prisma
model InventoryAllocationRule {
  id              String   @id @default(uuid()) @db.Uuid
  tenantId        String   @map("tenant_id") @db.Uuid
  facilityId      String   @map("facility_id") @db.Uuid
  ruleName        String   @map("rule_name") @db.VarChar(100)
  ruleType        String   @map("rule_type") @db.VarChar(50)    // FIFO, FEFO, LIFO, NEAREST_LOCATION, CLIENT_PREFERRED
  priority        Int      @default(100) @map("priority")
  isActive        Boolean  @default(true) @map("is_active")
  effectiveDate   DateTime @default(now()) @map("effective_date") @db.Date
  expiryDate      DateTime? @map("expiry_date") @db.Date
  description     String?  @map("description") @db.Text
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamptz

  constraints InventoryAllocationRuleConstraint[]
  locations   InventoryAllocationRuleLocation[]

  @@unique([tenantId, facilityId, ruleName], name: "allocation_rules_name_uq")
  @@index([tenantId, facilityId, isActive], name: "idx_alloc_rules_active")
  @@schema("multitenant")
  @@map("inventory_allocation_rules")
}

model InventoryAllocationRuleConstraint {
  id              String                  @id @default(uuid()) @db.Uuid
  tenantId        String                  @map("tenant_id") @db.Uuid
  ruleId          String                  @map("rule_id") @db.Uuid
  constraintField String                  @map("constraint_field") @db.VarChar(50)  // productId, clientId, zoneId, locationType
  constraintOperator String               @map("constraint_operator") @db.VarChar(20) // IN, NOT_IN, EQUALS, MIN, MAX
  constraintValue String                  @map("constraint_value") @db.Text
  rule            InventoryAllocationRule @relation(fields: [ruleId], references: [id], onDelete: Cascade)
  createdAt       DateTime                @default(now()) @map("created_at") @db.Timestamptz

  @@index([tenantId, ruleId], name: "idx_alloc_rule_constraints_rule")
  @@schema("multitenant")
  @@map("inventory_allocation_rule_constraints")
}

model InventoryAllocationRuleLocation {
  id              String                  @id @default(uuid()) @db.Uuid
  tenantId        String                  @map("tenant_id") @db.Uuid
  ruleId          String                  @map("rule_id") @db.Uuid
  locationId      String                  @map("location_id") @db.Uuid
  priority        Int                     @default(100) @map("priority")
  rule            InventoryAllocationRule @relation(fields: [ruleId], references: [id], onDelete: Cascade)
  createdAt       DateTime                @default(now()) @map("created_at") @db.Timestamptz

  @@index([tenantId, ruleId], name: "idx_alloc_rule_locations_rule")
  @@schema("multitenant")
  @@map("inventory_allocation_rule_locations")
}
```

#### New module: `src/inventory/allocation-rules/`
- `allocation-rules.module.ts`
- `allocation-rules.service.ts` — CRUD + rule evaluation engine
- `web/allocation-rules.controller.ts`
- `dtos/` — Create, Update, List DTOs

#### API endpoints:
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/web/inventory/allocation-rules` | Create rule |
| GET | `/web/inventory/allocation-rules` | List rules |
| GET | `/web/inventory/allocation-rules/:id` | Get rule with constraints & locations |
| PATCH | `/web/inventory/allocation-rules/:id` | Update rule |
| DELETE | `/web/inventory/allocation-rules/:id` | Delete rule |
| POST | `/web/inventory/allocation-rules/:id/constraints` | Add constraint |
| DELETE | `/web/inventory/allocation-rules/:id/constraints/:constraintId` | Remove constraint |
| POST | `/web/inventory/allocation-rules/:id/locations` | Add location override |
| DELETE | `/web/inventory/allocation-rules/:id/locations/:locationId` | Remove location override |
| POST | `/web/inventory/allocation-rules/evaluate` | Evaluate rules against a product/location |

#### Extend existing `AllocationService` (`src/outbound/allocation.service.ts`):
- Wire allocation rule evaluation into the existing allocation engine
- When allocating, query active rules, evaluate constraints, apply FIFO/FEFO ordering

#### Pattern to follow:
- `src/inventory/counts/` module structure for service patterns
- `src/outbound/allocation.service.ts` for the allocation engine integration

---

## PHASE 3: Outbound — Packing Workflow Integration

**Why**: PackingStation, PackingSession, PackingContainer models exist but are not wired together. This phase connects them into a real pack workflow.

### Task: Build PackingSession ↔ PackingStation ↔ PackingContainer workflow

#### New Prisma model:

```prisma
model PackingSessionStatusHistory {
  id          String               @id @default(uuid()) @db.Uuid
  tenantId    String               @map("tenant_id") @db.Uuid
  sessionId   String               @map("session_id") @db.Uuid
  fromStatus  PackingSessionStatus @map("from_status")
  toStatus    PackingSessionStatus @map("to_status")
  changedBy   String?              @map("changed_by") @db.Uuid
  reason      String?              @map("reason") @db.VarChar(255)
  changedAt   DateTime             @default(now()) @map("changed_at") @db.Timestamptz
  createdAt   DateTime             @default(now()) @map("created_at") @db.Timestamptz

  @@index([tenantId, sessionId, changedAt], name: "idx_packing_session_history_session")
  @@schema("multitenant")
  @@map("packing_session_status_histories")
}

model ShipmentStatusHistory {
  id          String          @id @default(uuid()) @db.Uuid
  tenantId    String          @map("tenant_id") @db.Uuid
  shipmentId  String          @map("shipment_id") @db.Uuid
  fromStatus  ShipmentStatus  @map("from_status")
  toStatus    ShipmentStatus  @map("to_status")
  changedBy   String?         @map("changed_by") @db.Uuid
  notes       String?         @map("notes") @db.Text
  changedAt   DateTime        @default(now()) @map("changed_at") @db.Timestamptz
  createdAt   DateTime        @default(now()) @map("created_at") @db.Timestamptz

  @@index([tenantId, shipmentId, changedAt], name: "idx_ship_status_history_shipment")
  @@schema("multitenant")
  @@map("shipment_status_histories")
}
```

#### Extend `PackingStationsModule` → rename to `PackingModule`:
- Add `PackingService` with full workflow:
  - `startSession(stationCode, userId)` — creates PackingSession, links to PackingStation
  - `scanItem(sessionId, productId/LPN, quantity)` — adds to PackingContainer
  - `sealContainer(containerId)` — seals container, sets status SEALED
  - `closeSession(sessionId)` — closes session, computes metrics
  - `statusHistory(sessionId)` — returns session timeline

#### New API endpoints:
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/web/packing/sessions/start` | Start packing session |
| POST | `/web/packing/sessions/:id/scan-item` | Scan item into container |
| POST | `/web/packing/sessions/:id/seal-container` | Seal active container |
| POST | `/web/packing/sessions/:id/close` | Close session |
| GET | `/web/packing/sessions/:id/history` | Session status history |
| GET | `/web/packing/sessions/:id/containers` | List containers in session |
| GET | `/rf/packing/sessions/my-active` | RF: get active session |
| POST | `/rf/packing/sessions/:id/scan-item` | RF: scan item |
| POST | `/rf/packing/sessions/:id/seal-container` | RF: seal container |
| GET | `/web/shipments/:id/status-history` | Shipment status timeline |

#### Pattern to follow:
- `src/outbound/packing-stations/packing-stations.module.ts` — extend, don't replace
- `src/outbound/packing.service.ts` — already exists, extend with session workflow

#### Migration note:
- Update `PackingSession` to add `stationId` FK (+ `station` relation to `PackingStation`)
- Create `ShipmentStatusHistory` and `PackingSessionStatusHistory` tables

---

## PHASE 4: Inventory — LPN Transaction History & Count Metrics

**Why**: LPN-level audit trail and count accuracy measurement are essential for inventory integrity.

### Task: Create LPN transaction log + count accuracy history

#### New Prisma models:

```prisma
model LpnTransaction {
  id              String   @id @default(uuid()) @db.Uuid
  tenantId        String   @map("tenant_id") @db.Uuid
  facilityId      String   @map("facility_id") @db.Uuid
  lpnId           String   @map("lpn_id") @db.Uuid
  transactionType String   @map("transaction_type") @db.VarChar(50)  // CREATE, MOVE, SPLIT, MERGE, PICK, PACK, SHIP, ADJUST, DISPOSE
  fromLocationId  String?  @map("from_location_id") @db.Uuid
  toLocationId    String?  @map("to_location_id") @db.Uuid
  quantityBefore  Float?   @map("quantity_before") @db.Real
  quantityAfter   Float?   @map("quantity_after") @db.Real
  quantityChange  Float?   @map("quantity_change") @db.Real
  referenceType   String?  @map("reference_type") @db.VarChar(50)
  referenceId     String?  @map("reference_id") @db.VarChar(100)
  performedByUserId String? @map("performed_by_user_id") @db.Uuid
  metadata        Json?    @map("metadata") @db.Json
  transactionAt   DateTime @default(now()) @map("transaction_at") @db.Timestamptz
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@index([tenantId, lpnId, transactionAt], name: "idx_lpn_txn_lpn_time")
  @@index([tenantId, referenceType, referenceId], name: "idx_lpn_txn_reference")
  @@schema("multitenant")
  @@map("lpn_transactions")
}

model CountAccuracyHistory {
  id              String   @id @default(uuid()) @db.Uuid
  tenantId        String   @map("tenant_id") @db.Uuid
  facilityId      String   @map("facility_id") @db.Uuid
  countId         String   @map("count_id") @db.Uuid
  lineId          String   @map("line_id") @db.Uuid
  productId       String   @map("product_id") @db.Uuid
  locationId      String   @map("location_id") @db.Uuid
  systemQuantity  Float    @map("system_quantity") @db.Real
  countedQuantity Float    @map("counted_quantity") @db.Real
  variance        Float    @map("variance") @db.Real
  variancePercent Float?   @map("variance_percent") @db.Real
  accuracyScore   Float?   @map("accuracy_score") @db.Real  // 0.0 - 1.0
  adjustmentId    String?  @map("adjustment_id") @db.Uuid
  recordedAt      DateTime @default(now()) @map("recorded_at") @db.Timestamptz
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@index([tenantId, facilityId, productId], name: "idx_cah_product")
  @@index([tenantId, countId], name: "idx_cah_count")
  @@index([tenantId, recordedAt], name: "idx_cah_recorded")
  @@schema("multitenant")
  @@map("count_accuracy_histories")
}

model CycleCountMetrics {
  id                String   @id @default(uuid()) @db.Uuid
  tenantId          String   @map("tenant_id") @db.Uuid
  facilityId        String   @map("facility_id") @db.Uuid
  countId           String   @map("count_id") @db.Uuid
  totalLines        Int      @map("total_lines")
  countedLines      Int      @map("counted_lines")
  zeroVarianceLines Int      @map("zero_variance_lines")
  positiveVarianceLines Int  @map("positive_variance_lines")
  negativeVarianceLines Int  @map("negative_variance_lines")
  totalVariance     Float    @map("total_variance") @db.Real
  accuracyRate      Float?   @map("accuracy_rate") @db.Real
  durationMinutes   Int?     @map("duration_minutes")
  recordedAt        DateTime @default(now()) @map("recorded_at") @db.Timestamptz
  createdAt         DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@unique([tenantId, countId], name: "cycle_count_metrics_count_uq")
  @@index([tenantId, facilityId, recordedAt], name: "idx_ccm_recorded")
  @@schema("multitenant")
  @@map("cycle_count_metrics")
}
```

#### Extend `CycleCountModule` (`src/inventory/counts/`):
- Add `CountMetricsService` — calculates metrics on count finalization
- Add `LpnTransactionService` — logs every LPN status/location change
- Wire LPN transaction logging into existing `LpnService` (`src/warehouse/lpn/`)

#### API endpoints:

**LPN Transactions:**
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/web/lpn/:lpnId/transactions` | Transaction history for an LPN |
| GET | `/web/lpn-transactions` | List all (filter by `lpnId`, `transactionType`) |

**Count Metrics:**
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/web/cycle-counts/metrics` | Aggregate metrics across counts |
| GET | `/web/cycle-counts/:id/metrics` | Metrics for a specific count |
| GET | `/web/count-accuracy` | Accuracy records, filterable by `productId`, date range |

#### Pattern to follow:
- `src/inventory/inventory-transaction.service.ts` — similar audit log pattern
- `src/inventory/counts/` — existing cycle count module to extend

---

## PHASE 5: Quality — Inspection Results & Compliance

**Why**: The existing Inspection model is minimal. Need full inspection lifecycle, compliance audits, hazmat.

### Task: Extend quality models + create compliance/hazmat models

#### New Prisma models:

```prisma
model QualityInspection {
  id                String   @id @default(uuid()) @db.Uuid
  tenantId          String   @map("tenant_id") @db.Uuid
  facilityId        String   @map("facility_id") @db.Uuid
  inspectionNumber  String   @map("inspection_number") @db.VarChar(50)
  inspectionType    String   @map("inspection_type") @db.VarChar(50) // RECEIVING, PICKING, RETURN, ROUTINE, COMPLIANCE
  referenceType     String?  @map("reference_type") @db.VarChar(50)
  referenceId       String?  @map("reference_id") @db.VarChar(100)
  productId         String?  @map("product_id") @db.Uuid
  lotId             String?  @map("lot_id") @db.Uuid
  locationId        String?  @map("location_id") @db.Uuid
  assignedToUserId  String?  @map("assigned_to_user_id") @db.Uuid
  status            String   @default("PENDING") @map("status") @db.VarChar(20) // PENDING, IN_PROGRESS, PASSED, FAILED, CONDITIONAL
  priority          String   @default("MEDIUM") @map("priority") @db.VarChar(10)
  notes             String?  @map("notes") @db.Text
  scheduledDate     DateTime? @map("scheduled_date") @db.Timestamptz
  completedAt       DateTime? @map("completed_at") @db.Timestamptz
  createdAt         DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime @updatedAt @map("updated_at") @db.Timestamptz

  results QualityInspectionResult[]
  events  QualityInspectionEvent[]

  @@unique([tenantId, inspectionNumber], name: "quality_inspections_number_uq")
  @@index([tenantId, facilityId, status], name: "idx_qi_status")
  @@schema("multitenant")
  @@map("quality_inspections")
}

model QualityInspectionResult {
  id              String            @id @default(uuid()) @db.Uuid
  tenantId        String            @map("tenant_id") @db.Uuid
  inspectionId    String            @map("inspection_id") @db.Uuid
  checkType       String            @map("check_type") @db.VarChar(50)  // VISUAL, DIMENSIONAL, WEIGHT, COUNT, LABEL, DOCUMENT, TEST
  result          String            @map("result") @db.VarChar(20)     // PASS, FAIL, N/A
  measuredValue   Float?            @map("measured_value") @db.Real
  toleranceMin    Float?            @map("tolerance_min") @db.Real
  toleranceMax    Float?            @map("tolerance_max") @db.Real
  notes           String?           @map("notes") @db.Text
  mediaUrl        String?           @map("media_url") @db.VarChar(500)
  checkedByUserId String?           @map("checked_by_user_id") @db.Uuid
  checkedAt       DateTime          @default(now()) @map("checked_at") @db.Timestamptz
  createdAt       DateTime          @default(now()) @map("created_at") @db.Timestamptz

  inspection QualityInspection @relation(fields: [inspectionId], references: [id], onDelete: Cascade)

  @@index([tenantId, inspectionId], name: "idx_qir_inspection")
  @@schema("multitenant")
  @@map("quality_inspection_results")
}

model QualityInspectionEvent {
  id            String            @id @default(uuid()) @db.Uuid
  tenantId      String            @map("tenant_id") @db.Uuid
  inspectionId  String            @map("inspection_id") @db.Uuid
  eventType     String            @map("event_type") @db.VarChar(50) // ASSIGNED, STARTED, RESULT_SUBMITTED, COMPLETED, FAILED, REOPENED
  eventData     Json?             @map("event_data") @db.Json
  performedBy   String?           @map("performed_by") @db.Uuid
  performedAt   DateTime          @default(now()) @map("performed_at") @db.Timestamptz
  createdAt     DateTime          @default(now()) @map("created_at") @db.Timestamptz

  inspection QualityInspection @relation(fields: [inspectionId], references: [id], onDelete: Cascade)

  @@index([tenantId, inspectionId], name: "idx_qie_inspection")
  @@schema("multitenant")
  @@map("quality_inspection_events")
}

model ComplianceRequirement {
  id                String   @id @default(uuid()) @db.Uuid
  tenantId          String   @map("tenant_id") @db.Uuid
  facilityId        String   @map("facility_id") @db.Uuid
  complianceType    String   @map("compliance_type") @db.VarChar(50) // FDA, OSHA, ISO, CUSTOM
  requirementCode   String   @map("requirement_code") @db.VarChar(100)
  description       String   @map("description") @db.Text
  applicableEntity  String?  @map("applicable_entity") @db.VarChar(50) // PRODUCT, LOCATION, FACILITY, PROCESS
  frequencyType     String?  @map("frequency_type") @db.VarChar(20) // ONCE, DAILY, WEEKLY, MONTHLY, QUARTERLY, ANNUAL
  isActive          Boolean  @default(true) @map("is_active")
  createdAt         DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime @updatedAt @map("updated_at") @db.Timestamptz

  @@unique([tenantId, facilityId, requirementCode], name: "compliance_requirements_code_uq")
  @@schema("multitenant")
  @@map("compliance_requirements")
}

model ComplianceAudit {
  id              String               @id @default(uuid()) @db.Uuid
  tenantId        String               @map("tenant_id") @db.Uuid
  facilityId      String               @map("facility_id") @db.Uuid
  requirementId   String               @map("requirement_id") @db.Uuid
  auditNumber     String               @map("audit_number") @db.VarChar(50)
  status          String               @default("SCHEDULED") @map("status") @db.VarChar(20)
  result          String?              @map("result") @db.VarChar(20)   // PASS, FAIL, CONDITIONAL
  findings        Json?                @map("findings") @db.Json
  correctiveActions Json?              @map("corrective_actions") @db.Json
  auditedByUserId String?              @map("audited_by_user_id") @db.Uuid
  scheduledDate   DateTime?            @map("scheduled_date") @db.Timestamptz
  completedAt     DateTime?            @map("completed_at") @db.Timestamptz
  createdAt       DateTime             @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime             @updatedAt @map("updated_at") @db.Timestamptz

  requirement ComplianceRequirement @relation(fields: [requirementId], references: [id])

  @@unique([tenantId, auditNumber], name: "compliance_audits_number_uq")
  @@index([tenantId, facilityId, status], name: "idx_ca_status")
  @@schema("multitenant")
  @@map("compliance_audits")
}

model HazmatMaterial {
  id                String   @id @default(uuid()) @db.Uuid
  tenantId          String   @map("tenant_id") @db.Uuid
  facilityId        String   @map("facility_id") @db.Uuid
  productId         String   @map("product_id") @db.Uuid
  hazardClass       String   @map("hazard_class") @db.VarChar(10)   // Class 1-9
  division          String?  @map("division") @db.VarChar(10)
  unNumber          String   @map("un_number") @db.VarChar(10)
  packingGroup      String?  @map("packing_group") @db.VarChar(5)
  properShippingName String  @map("proper_shipping_name") @db.VarChar(255)
  flashPoint        String?  @map("flash_point") @db.VarChar(20)
  storageGroup      String?  @map("storage_group") @db.VarChar(50)
  emergencyContact  String?  @map("emergency_contact") @db.VarChar(255)
  emergencyPhone    String?  @map("emergency_phone") @db.VarChar(50)
  msdsUrl           String?  @map("msds_url") @db.VarChar(500)
  isActive          Boolean  @default(true) @map("is_active")
  createdAt         DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime @updatedAt @map("updated_at") @db.Timestamptz

  @@unique([tenantId, facilityId, productId], name: "hazmat_materials_product_uq")
  @@index([tenantId, hazardClass], name: "idx_hm_class")
  @@schema("multitenant")
  @@map("hazmat_materials")
}
```

#### New module: `src/quality/quality-inspections/`
- `quality-inspections.module.ts`
- `quality-inspections.service.ts`
- `web/quality-inspections.controller.ts`
- `rf/quality-inspections.controller.ts`
- `dtos/`

#### New module: `src/quality/compliance/`
- `compliance.module.ts`
- `compliance.service.ts`
- `web/compliance.controller.ts`
- `dtos/`

#### API endpoints:
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/web/quality/inspections` | Create inspection |
| GET | `/web/quality/inspections` | List (filter by status, type) |
| GET | `/web/quality/inspections/:id` | Get with results & events |
| PATCH | `/web/quality/inspections/:id` | Update (status, assignee) |
| POST | `/web/quality/inspections/:id/results` | Submit result |
| GET | `/web/quality/inspections/:id/events` | Event timeline |
| POST | `/rf/quality/inspections/my-tasks` | RF: list assigned |
| POST | `/rf/quality/inspections/:id/record-result` | RF: record result |
| POST | `/web/compliance/requirements` | Create requirement |
| GET | `/web/compliance/requirements` | List requirements |
| POST | `/web/compliance/audits` | Create audit |
| PATCH | `/web/compliance/audits/:id` | Update audit result |
| POST | `/web/hazmat/materials` | Register hazmat material |
| GET | `/web/hazmat/materials` | List hazmat materials |

#### Pattern to follow:
- `src/quality/non-conformance-reports/` — module structure
- `src/inbound/web/quality.controller.ts` — existing quality routes

---

## PHASE 6: VAS — Service Catalog & Client Rates

**Why**: VasExecutionTask exists but there's no service catalog or rate card. This separates service definition from execution.

### Task: Create VAS service catalog + client rates + workstation models

#### New Prisma models:

```prisma
model VasService {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  serviceCode   String   @map("service_code") @db.VarChar(50)
  serviceName   String   @map("service_name") @db.VarChar(255)
  description   String?  @map("description") @db.Text
  category      String?  @map("category") @db.VarChar(50)  // KITTING, LABELING, PACKAGING, ASSEMBLY, INSPECTION, REPACK
  defaultRate   Decimal? @map("default_rate") @db.Decimal(12, 4)
  uomId         String?  @map("uom_id") @db.Uuid
  estimatedTimeMinutes Int? @map("estimated_time_minutes")
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz

  clientRates VasServiceClientRate[]

  @@unique([tenantId, serviceCode], name: "vas_services_code_uq")
  @@schema("multitenant")
  @@map("vas_services")
}

model VasServiceClientRate {
  id          String    @id @default(uuid()) @db.Uuid
  tenantId    String    @map("tenant_id") @db.Uuid
  serviceId   String    @map("service_id") @db.Uuid
  clientId    String    @map("client_id") @db.Uuid
  ratePerUnit Decimal   @map("rate_per_unit") @db.Decimal(12, 4)
  currency    String    @default("USD") @map("currency") @db.VarChar(3)
  minCharge   Decimal?  @map("min_charge") @db.Decimal(12, 4)
  effectiveDate DateTime @default(now()) @map("effective_date") @db.Date
  expiryDate  DateTime? @map("expiry_date") @db.Date
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  service VasService @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@unique([tenantId, serviceId, clientId, effectiveDate], name: "vas_client_rates_uq")
  @@schema("multitenant")
  @@map("vas_service_client_rates")
}

model VasWorkstation {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  facilityId    String   @map("facility_id") @db.Uuid
  workstationCode String @map("workstation_code") @db.VarChar(50)
  workstationName String @map("workstation_name") @db.VarChar(255)
  stationType   String   @map("station_type") @db.VarChar(50) // KITTING, LABELING, ASSEMBLY, PACKING
  locationId    String?  @map("location_id") @db.Uuid
  isActive      Boolean  @default(true) @map("is_active")
  isAvailable   Boolean  @default(true) @map("is_available")
  capabilities  Json?    @map("capabilities") @db.Json
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz

  @@unique([tenantId, facilityId, workstationCode], name: "vas_workstations_code_uq")
  @@schema("multitenant")
  @@map("vas_workstations")
}
```

#### New module: `src/outbound/vas-catalog/`
- `vas-catalog.module.ts`
- `vas-catalog.service.ts`
- `web/vas-catalog.controller.ts`
- `dtos/`

#### API endpoints:
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/web/vas/services` | Create VAS service |
| GET | `/web/vas/services` | List catalog |
| PATCH | `/web/vas/services/:id` | Update service |
| POST | `/web/vas/client-rates` | Set client-specific rate |
| GET | `/web/vas/client-rates` | List (filter by clientId) |
| POST | `/web/vas/workstations` | Create workstation |
| GET | `/web/vas/workstations` | List workstations |
| PATCH | `/web/vas/workstations/:id` | Update workstation |

#### Wire into existing `VasExecutionModule`:
- When creating a `VasExecutionTask`, validate service exists in catalog
- Fetch rate from `VasServiceClientRate` or fallback to `VasService.defaultRate`
- Populate `ratePerUnit` and `totalCharge` on the task

#### Pattern to follow:
- `src/outbound/vas-execution/` — sibling module for execution
- `src/master-data/product-packaging/` — similar catalog structure

---

## PHASE 7: Storage Billing Engine

**Why**: Core monetization feature. Rates, snapshots, charges, invoices.

### Task: Create full storage billing module

#### New Prisma models:

```prisma
model StorageRateMaster {
  id                String   @id @default(uuid()) @db.Uuid
  tenantId          String   @map("tenant_id") @db.Uuid
  facilityId        String   @map("facility_id") @db.Uuid
  rateCode          String   @map("rate_code") @db.VarChar(50)
  rateName          String   @map("rate_name") @db.VarChar(255)
  rateType          String   @map("rate_type") @db.VarChar(20) // PER_PALLET, PER_SQFT, PER_CUBIC_FOOT, FLAT
  calculationBasis  String   @map("calculation_basis") @db.VarChar(20) // DAILY, WEEKLY, MONTHLY, ANNUAL
  defaultRate       Decimal  @map("default_rate") @db.Decimal(12, 4)
  currency          String   @default("USD") @map("currency") @db.VarChar(3)
  minCharge         Decimal? @map("min_charge") @db.Decimal(12, 4)
  maxCharge         Decimal? @map("max_charge") @db.Decimal(12, 4)
  effectiveDate     DateTime @default(now()) @map("effective_date") @db.Date
  expiryDate        DateTime? @map("expiry_date") @db.Date
  isActive          Boolean  @default(true) @map("is_active")
  createdAt         DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime @updatedAt @map("updated_at") @db.Timestamptz

  clientRates StorageClientRate[]

  @@unique([tenantId, facilityId, rateCode], name: "storage_rate_master_code_uq")
  @@schema("multitenant")
  @@map("storage_rate_master")
}

model StorageClientRate {
  id            String             @id @default(uuid()) @db.Uuid
  tenantId      String             @map("tenant_id") @db.Uuid
  rateMasterId  String             @map("rate_master_id") @db.Uuid
  clientId      String             @map("client_id") @db.Uuid
  negotiatedRate Decimal            @map("negotiated_rate") @db.Decimal(12, 4)
  effectiveDate DateTime            @default(now()) @map("effective_date") @db.Date
  expiryDate    DateTime?           @map("expiry_date") @db.Date
  isActive      Boolean             @default(true) @map("is_active")
  createdAt     DateTime            @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime            @updatedAt @map("updated_at") @db.Timestamptz

  rateMaster StorageRateMaster @relation(fields: [rateMasterId], references: [id], onDelete: Cascade)

  @@unique([tenantId, rateMasterId, clientId, effectiveDate], name: "storage_client_rates_uq")
  @@schema("multitenant")
  @@map("storage_client_rates")
}

model BillingCycle {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  facilityId    String   @map("facility_id") @db.Uuid
  cycleCode     String   @map("cycle_code") @db.VarChar(50)
  cycleName     String   @map("cycle_name") @db.VarChar(255)
  frequency     String   @map("frequency") @db.VarChar(20) // WEEKLY, MONTHLY, QUARTERLY
  billingDay    Int      @map("billing_day") // Day of month/week
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz

  @@unique([tenantId, facilityId, cycleCode], name: "billing_cycles_code_uq")
  @@schema("multitenant")
  @@map("billing_cycles")
}

model StorageInventorySnapshot {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  facilityId    String   @map("facility_id") @db.Uuid
  snapshotDate  DateTime @map("snapshot_date") @db.Date
  clientId      String   @map("client_id") @db.Uuid
  productId     String   @map("product_id") @db.Uuid
  locationId    String?  @map("location_id") @db.Uuid
  quantity      Float    @map("quantity") @db.Real
  palletCount   Int?     @map("pallet_count")
  volumeCubicFt Float?   @map("volume_cubic_ft") @db.Real
  daysStored    Int      @map("days_stored")
  rateAppliedId String?  @map("rate_applied_id") @db.Uuid
  chargeAmount  Decimal? @map("charge_amount") @db.Decimal(12, 4)
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@unique([tenantId, facilityId, snapshotDate, clientId, productId, locationId], name: "storage_snapshots_uq")
  @@index([tenantId, facilityId, snapshotDate], name: "idx_ss_snapshot_date")
  @@schema("multitenant")
  @@map("storage_inventory_snapshots")
}

model StorageCharge {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  facilityId    String   @map("facility_id") @db.Uuid
  chargeNumber  String   @map("charge_number") @db.VarChar(50)
  clientId      String   @map("client_id") @db.Uuid
  chargeType    String   @map("charge_type") @db.VarChar(30) // STORAGE, VAS, HANDLING, PENALTY
  cycleId       String?  @map("cycle_id") @db.Uuid
  periodStart   DateTime @map("period_start") @db.Date
  periodEnd     DateTime @map("period_end") @db.Date
  chargeDate    DateTime @default(now()) @map("charge_date") @db.Date
  quantity      Float    @map("quantity") @db.Real
  rateApplied   Decimal  @map("rate_applied") @db.Decimal(12, 4)
  amount        Decimal  @map("amount") @db.Decimal(12, 4)
  currency      String   @default("USD") @map("currency") @db.VarChar(3)
  status        String   @default("PENDING") @map("status") @db.VarChar(20) // PENDING, INVOICED, CANCELLED
  invoiceId     String?  @map("invoice_id") @db.Uuid
  description   String?  @map("description") @db.Text
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz

  @@unique([tenantId, chargeNumber], name: "storage_charges_number_uq")
  @@index([tenantId, facilityId, clientId, status], name: "idx_sc_client_status")
  @@schema("multitenant")
  @@map("storage_charges")
}

model ClientInvoice {
  id            String    @id @default(uuid()) @db.Uuid
  tenantId      String    @map("tenant_id") @db.Uuid
  facilityId    String    @map("facility_id") @db.Uuid
  invoiceNumber String    @map("invoice_number") @db.VarChar(50)
  clientId      String    @map("client_id") @db.Uuid
  invoiceDate   DateTime  @default(now()) @map("invoice_date") @db.Date
  dueDate       DateTime  @map("due_date") @db.Date
  periodStart   DateTime  @map("period_start") @db.Date
  periodEnd     DateTime  @map("period_end") @db.Date
  subtotal      Decimal   @map("subtotal") @db.Decimal(14, 2)
  taxAmount     Decimal?  @default(0) @map("tax_amount") @db.Decimal(14, 2)
  discountAmount Decimal? @default(0) @map("discount_amount") @db.Decimal(14, 2)
  totalAmount   Decimal   @map("total_amount") @db.Decimal(14, 2)
  currency      String    @default("USD") @map("currency") @db.VarChar(3)
  status        String    @default("DRAFT") @map("status") @db.VarChar(20) // DRAFT, SENT, PAID, OVERDUE, CANCELLED
  paidAt        DateTime? @map("paid_at") @db.Timestamptz
  notes         String?   @map("notes") @db.Text
  lines         ClientInvoiceLine[]
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  @@unique([tenantId, invoiceNumber], name: "client_invoices_number_uq")
  @@index([tenantId, clientId, status], name: "idx_ci_client_status")
  @@schema("multitenant")
  @@map("client_invoices")
}

model ClientInvoiceLine {
  id            String        @id @default(uuid()) @db.Uuid
  tenantId      String        @map("tenant_id") @db.Uuid
  invoiceId     String        @map("invoice_id") @db.Uuid
  chargeId      String?       @map("charge_id") @db.Uuid
  lineType      String        @map("line_type") @db.VarChar(30) // STORAGE, VAS, HANDLING, ADJUSTMENT
  description   String?       @map("description") @db.Text
  quantity      Float         @map("quantity") @db.Real
  unitPrice     Decimal       @map("unit_price") @db.Decimal(12, 4)
  lineTotal     Decimal       @map("line_total") @db.Decimal(14, 2)
  createdAt     DateTime      @default(now()) @map("created_at") @db.Timestamptz

  invoice ClientInvoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@index([tenantId, invoiceId], name: "idx_cil_invoice")
  @@schema("multitenant")
  @@map("client_invoice_lines")
}
```

#### New module: `src/billing/`
- `billing.module.ts`
- `storage-rate.service.ts` — rate master + client rates CRUD
- `billing-cycle.service.ts` — cycle configuration
- `snapshot.service.ts` — daily inventory snapshot + charge calculation
- `invoice.service.ts` — invoice generation & lifecycle
- `web/billing.controller.ts`
- `dtos/`

#### API endpoints:
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/web/billing/rates` | Create rate |
| GET | `/web/billing/rates` | List rates |
| POST | `/web/billing/client-rates` | Set client rate |
| POST | `/web/billing/cycles` | Create billing cycle |
| GET | `/web/billing/cycles` | List cycles |
| POST | `/web/billing/snapshots/generate` | Generate daily snapshot |
| GET | `/web/billing/snapshots` | List snapshots (by date, client) |
| POST | `/web/billing/charges/calculate` | Calculate charges from snapshot |
| GET | `/web/billing/charges` | List charges |
| POST | `/web/billing/invoices/generate` | Generate invoice from charges |
| GET | `/web/billing/invoices` | List invoices |
| GET | `/web/billing/invoices/:id` | Get invoice with lines |
| PATCH | `/web/billing/invoices/:id/status` | Update invoice status |

#### Pattern to follow:
- `src/inventory/counts/` — complex business logic similar to charge calculation
- `src/outbound/carrier-rate-shopping/` — rate management pattern

---

## PHASE 8: Dock & Yard Management Extension

**Why**: LoadingDocksModule exists. Add appointment scheduling and yard management.

### Task: Extend LoadingDocksModule with dock appointments + yard vehicles

#### New Prisma models:

```prisma
model DockAppointment {
  id              String    @id @default(uuid()) @db.Uuid
  tenantId        String    @map("tenant_id") @db.Uuid
  facilityId      String    @map("facility_id") @db.Uuid
  dockId          String    @map("dock_id") @db.Uuid
  appointmentNumber String  @map("appointment_number") @db.VarChar(50)
  appointmentType String    @map("appointment_type") @db.VarChar(20) // RECEIVING, SHIPPING, BOTH
  carrierName     String?   @map("carrier_name") @db.VarChar(255)
  carrierCode     String?   @map("carrier_code") @db.VarChar(50)
  driverName      String?   @map("driver_name") @db.VarChar(255)
  driverPhone     String?   @map("driver_phone") @db.VarChar(50)
  vehiclePlate    String?   @map("vehicle_plate") @db.VarChar(50)
  trailerId       String?   @map("trailer_id") @db.VarChar(50)
  referenceType   String?   @map("reference_type") @db.VarChar(50) // PO, ASN, LOAD, SO
  referenceNumber String?   @map("reference_number") @db.VarChar(100)
  scheduledStart  DateTime  @map("scheduled_start") @db.Timestamptz
  scheduledEnd    DateTime  @map("scheduled_end") @db.Timestamptz
  actualArrival   DateTime? @map("actual_arrival") @db.Timestamptz
  actualDeparture DateTime? @map("actual_departure") @db.Timestamptz
  status          String    @default("SCHEDULED") @map("status") @db.VarChar(20) // SCHEDULED, CHECKED_IN, LOADING, COMPLETED, CANCELLED, NO_SHOW
  notes           String?   @map("notes") @db.Text
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  @@unique([tenantId, facilityId, appointmentNumber], name: "dock_appointments_number_uq")
  @@index([tenantId, dockId, scheduledStart], name: "idx_da_dock_time")
  @@index([tenantId, status], name: "idx_da_status")
  @@schema("multitenant")
  @@map("dock_appointments")
}

model YardVehicle {
  id              String   @id @default(uuid()) @db.Uuid
  tenantId        String   @map("tenant_id") @db.Uuid
  facilityId      String   @map("facility_id") @db.Uuid
  vehicleType     String   @map("vehicle_type") @db.VarChar(20) // TRUCK, TRAILER, CONTAINER
  vehiclePlate    String   @map("vehicle_plate") @db.VarChar(50)
  carrierCode     String?  @map("carrier_code") @db.VarChar(50)
  driverName      String?  @map("driver_name") @db.VarChar(255)
  driverPhone     String?  @map("driver_phone") @db.VarChar(50)
  sealNumber      String?  @map("seal_number") @db.VarChar(50)
  yardLocation    String?  @map("yard_location") @db.VarChar(100)  // PARKING_SPOT, DOCK_BAY, STAGING
  status          String   @default("EXPECTED") @map("status") @db.VarChar(20) // EXPECTED, IN_YARD, AT_DOCK, DEPARTED
  arrivedAt       DateTime? @map("arrived_at") @db.Timestamptz
  dockAssignedAt  DateTime? @map("dock_assigned_at") @db.Timestamptz
  departedAt      DateTime? @map("departed_at") @db.Timestamptz
  notes           String?  @map("notes") @db.Text
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamptz

  @@unique([tenantId, facilityId, vehiclePlate], name: "yard_vehicles_plate_uq")
  @@index([tenantId, status], name: "idx_yv_status")
  @@schema("multitenant")
  @@map("yard_vehicles")
}
```

#### Extend `LoadingDocksModule` → `src/outbound/dock-yard/`:
- Add dock appointment service + controller
- Add yard vehicle service + controller

#### API endpoints:
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/web/dock-appointments` | Create appointment |
| GET | `/web/dock-appointments` | List (filter by `dockId`, `date`, `status`) |
| PATCH | `/web/dock-appointments/:id/check-in` | Check in |
| PATCH | `/web/dock-appointments/:id/complete` | Complete appointment |
| PATCH | `/web/dock-appointments/:id/cancel` | Cancel appointment |
| POST | `/web/yard/vehicles` | Register vehicle |
| GET | `/web/yard/vehicles` | List vehicles in yard |
| PATCH | `/web/yard/vehicles/:id/assign-dock` | Assign to dock |
| PATCH | `/web/yard/vehicles/:id/depart` | Mark departed |
| GET | `/rf/dock-appointments/upcoming` | RF: today's appointments |

#### Pattern to follow:
- `src/outbound/loading-docks/` — existing dock module to extend
- `src/outbound/loads/load.module.ts` — similar lifecycle pattern

---

## PHASE 9: Labor Management

**Why**: Track worker time, shifts, and productivity — essential for warehouse operations.

### Task: Create labor management module

#### New Prisma models:

```prisma
model LaborShift {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  facilityId    String   @map("facility_id") @db.Uuid
  shiftCode     String   @map("shift_code") @db.VarChar(50)
  shiftName     String   @map("shift_name") @db.VarChar(255)
  startTime     String   @map("start_time") @db.VarChar(5) // HH:MM
  endTime       String   @map("end_time") @db.VarChar(5)
  timezone      String?  @default("UTC") @map("timezone") @db.VarChar(50)
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz

  assignments LaborShiftAssignment[]

  @@unique([tenantId, facilityId, shiftCode], name: "labor_shifts_code_uq")
  @@schema("multitenant")
  @@map("labor_shifts")
}

model LaborShiftAssignment {
  id            String    @id @default(uuid()) @db.Uuid
  tenantId      String    @map("tenant_id") @db.Uuid
  facilityId    String    @map("facility_id") @db.Uuid
  shiftId       String    @map("shift_id") @db.Uuid
  userId        String    @map("user_id") @db.Uuid
  effectiveDate DateTime  @map("effective_date") @db.Date
  expiryDate    DateTime? @map("expiry_date") @db.Date
  isActive      Boolean   @default(true) @map("is_active")
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz

  shift LaborShift @relation(fields: [shiftId], references: [id], onDelete: Cascade)

  @@unique([tenantId, shiftId, userId, effectiveDate], name: "labor_shift_assignments_uq")
  @@index([tenantId, userId], name: "idx_lsa_user")
  @@schema("multitenant")
  @@map("labor_shift_assignments")
}

model LaborTimeLog {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  facilityId    String   @map("facility_id") @db.Uuid
  userId        String   @map("user_id") @db.Uuid
  shiftId       String?  @map("shift_id") @db.Uuid
  clockIn       DateTime @map("clock_in") @db.Timestamptz
  clockOut      DateTime? @map("clock_out") @db.Timestamptz
  breakDuration Int?     @default(0) @map("break_duration_minutes")
  totalMinutes  Int?     @map("total_minutes")
  overtimeMinutes Int?   @default(0) @map("overtime_minutes")
  status        String   @default("ACTIVE") @map("status") @db.VarChar(20) // ACTIVE, COMPLETED, ABSENT
  notes         String?  @map("notes") @db.Text
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz

  @@index([tenantId, userId, clockIn], name: "idx_ltl_user_time")
  @@index([tenantId, facilityId, clockIn], name: "idx_ltl_facility_time")
  @@schema("multitenant")
  @@map("labor_time_logs")
}

model LaborPerformanceMetric {
  id              String   @id @default(uuid()) @db.Uuid
  tenantId        String   @map("tenant_id") @db.Uuid
  facilityId      String   @map("facility_id") @db.Uuid
  userId          String   @map("user_id") @db.Uuid
  metricDate      DateTime @map("metric_date") @db.Date
  totalPicks      Int?     @default(0) @map("total_picks")
  picksPerHour    Float?   @map("picks_per_hour") @db.Real
  totalPacks      Int?     @default(0) @map("total_packs")
  packsPerHour    Float?   @map("packs_per_hour") @db.Real
  totalReceives   Int?     @default(0) @map("total_receives")
  totalPutaways   Int?     @default(0) @map("total_putaways")
  totalLinesCounted Int?   @default(0) @map("total_lines_counted")
  accuracyRate    Float?   @map("accuracy_rate") @db.Real
  idleMinutes     Int?     @default(0) @map("idle_minutes")
  productiveMinutes Int?   @default(0) @map("productive_minutes")
  score           Float?   @map("score") @db.Real // Composite productivity score
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamptz

  @@unique([tenantId, userId, metricDate], name: "labor_perf_metrics_uq")
  @@index([tenantId, facilityId, metricDate], name: "idx_lpm_date")
  @@schema("multitenant")
  @@map("labor_performance_metrics")
}
```

#### New module: `src/labor/`
- `labor.module.ts`
- `shift.service.ts` — shift CRUD
- `time-tracking.service.ts` — clock in/out, time log management
- `performance.service.ts` — metrics calculation
- `web/labor.controller.ts`
- `rf/labor.controller.ts`
- `dtos/`

#### API endpoints:
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/web/labor/shifts` | Create shift |
| GET | `/web/labor/shifts` | List shifts |
| PATCH | `/web/labor/shifts/:id` | Update shift |
| POST | `/web/labor/assignments` | Assign user to shift |
| GET | `/web/labor/assignments` | List assignments (by userId, shiftId) |
| POST | `/web/labor/time-logs/clock-in` | Clock in |
| POST | `/web/labor/time-logs/clock-out` | Clock out |
| GET | `/web/labor/time-logs` | Time logs (filter by userId, date) |
| GET | `/web/labor/performance` | Performance metrics |
| POST | `/rf/labor/clock-in` | RF: clock in |
| POST | `/rf/labor/clock-out` | RF: clock out |
| GET | `/rf/labor/my-metrics` | RF: today's metrics |

#### Pattern to follow:
- `src/inventory/counts/` — module structure for time-tracked operations
- `src/outbound/picking.service.ts` — could wire into labor performance

---

## PHASE 10: Equipment Management

### Task: Create equipment registry + maintenance tracking

#### New Prisma models:

```prisma
model WarehouseEquipment {
  id              String    @id @default(uuid()) @db.Uuid
  tenantId        String    @map("tenant_id") @db.Uuid
  facilityId      String    @map("facility_id") @db.Uuid
  equipmentCode   String    @map("equipment_code") @db.VarChar(50)
  equipmentName   String    @map("equipment_name") @db.VarChar(255)
  equipmentType   String    @map("equipment_type") @db.VarChar(50) // FORKLIFT, PALLET_JACK, HAND_TRUCK, CONVEYOR, SCANNER, PRINTER
  manufacturer    String?   @map("manufacturer") @db.VarChar(255)
  model           String?   @map("model") @db.VarChar(255)
  serialNumber    String?   @map("serial_number") @db.VarChar(100)
  year            Int?      @map("year")
  status          String    @default("AVAILABLE") @map("status") @db.VarChar(20) // AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, DECOMMISSIONED
  lastMaintenanceAt DateTime? @map("last_maintenance_at") @db.Timestamptz
  nextMaintenanceDue DateTime? @map("next_maintenance_due") @db.Timestamptz
  locationId      String?   @map("location_id") @db.Uuid
  notes           String?   @map("notes") @db.Text
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  maintenanceRecords EquipmentMaintenance[]

  @@unique([tenantId, facilityId, equipmentCode], name: "warehouse_equipment_code_uq")
  @@index([tenantId, status], name: "idx_we_status")
  @@schema("multitenant")
  @@map("warehouse_equipment")
}

model EquipmentMaintenance {
  id              String              @id @default(uuid()) @db.Uuid
  tenantId        String              @map("tenant_id") @db.Uuid
  facilityId      String              @map("facility_id") @db.Uuid
  equipmentId     String              @map("equipment_id") @db.Uuid
  maintenanceNumber String            @map("maintenance_number") @db.VarChar(50)
  maintenanceType String              @map("maintenance_type") @db.VarChar(20) // PREVENTIVE, REPAIR, INSPECTION
  priority        String              @default("MEDIUM") @map("priority") @db.VarChar(10)
  status          String              @default("OPEN") @map("status") @db.VarChar(20) // OPEN, IN_PROGRESS, COMPLETED, CANCELLED
  description     String?             @map("description") @db.Text
  performedByUserId String?            @map("performed_by_user_id") @db.Uuid
  cost            Decimal?            @map("cost") @db.Decimal(12, 2)
  downtimeMinutes Int?                @map("downtime_minutes")
  completedAt     DateTime?           @map("completed_at") @db.Timestamptz
  notes           String?             @map("notes") @db.Text
  createdAt       DateTime            @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime            @updatedAt @map("updated_at") @db.Timestamptz

  equipment WarehouseEquipment @relation(fields: [equipmentId], references: [id], onDelete: Cascade)

  @@unique([tenantId, maintenanceNumber], name: "equipment_maintenance_number_uq")
  @@index([tenantId, equipmentId], name: "idx_em_equipment")
  @@schema("multitenant")
  @@map("equipment_maintenance")
}
```

#### New module: `src/equipment/`
- `equipment.module.ts`
- `equipment.service.ts` — CRUD + status management
- `maintenance.service.ts` — maintenance record lifecycle
- `web/equipment.controller.ts`
- `rf/equipment.controller.ts`
- `dtos/`

#### API endpoints:
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/web/equipment` | Register equipment |
| GET | `/web/equipment` | List (filter by type, status) |
| PATCH | `/web/equipment/:id` | Update equipment |
| PATCH | `/web/equipment/:id/status` | Change status |
| POST | `/web/equipment/:id/maintenance` | Create maintenance record |
| GET | `/web/equipment/maintenance` | List maintenance records |
| PATCH | `/web/equipment/maintenance/:id/complete` | Complete maintenance |
| GET | `/rf/equipment/available` | RF: list available equipment |
| POST | `/rf/equipment/:id/check-out` | RF: check out (set IN_USE) |
| POST | `/rf/equipment/:id/check-in` | RF: check in (set AVAILABLE) |

#### Pattern to follow:
- `src/outbound/loading-docks/` — similar check-in/check-out lifecycle
- `src/master-data/vendors/` — equipment CRUD similar pattern

---

## PHASE 11: Exception Management Enhancement

**Why**: ExceptionManagementModule exists but lacks comments and escalation rules.

### Task: Add comments + escalation rules to ExceptionManagement

#### New Prisma models:

```prisma
model ExceptionComment {
  id              String              @id @default(uuid()) @db.Uuid
  tenantId        String              @map("tenant_id") @db.Uuid
  exceptionId     String              @map("exception_id") @db.Uuid
  body            String              @map("body") @db.Text
  authorUserId    String              @map("author_user_id") @db.Uuid
  isInternal      Boolean             @default(false) @map("is_internal")
  createdAt       DateTime            @default(now()) @map("created_at") @db.Timestamptz

  exception ExceptionManagement @relation(fields: [exceptionId], references: [id], onDelete: Cascade)

  @@index([tenantId, exceptionId, createdAt], name: "idx_exc_comment_exception")
  @@schema("multitenant")
  @@map("exception_comments")
}

model ExceptionEscalationRule {
  id              String   @id @default(uuid()) @db.Uuid
  tenantId        String   @map("tenant_id") @db.Uuid
  facilityId      String   @map("facility_id") @db.Uuid
  ruleName        String   @map("rule_name") @db.VarChar(100)
  exceptionType   String   @map("exception_type") @db.VarChar(50)
  severityMinimum String   @map("severity_minimum") @db.VarChar(20)
  unresolvedHours Int      @map("unresolved_hours")
  escalateToUserId String  @map("escalate_to_user_id") @db.Uuid
  notifyViaEmail  Boolean  @default(true) @map("notify_via_email")
  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamptz

  @@unique([tenantId, facilityId, ruleName], name: "escalation_rules_name_uq")
  @@schema("multitenant")
  @@map("exception_escalation_rules")
}
```

#### Extend `ExceptionManagementModule`:
- Add `ExceptionCommentService` — add/list comments
- Add `ExceptionEscalationService` — escalation rules + auto-escalation check
- Wire escalation into exception status change events

#### API endpoints:
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/web/exceptions/:id/comments` | Add comment |
| GET | `/web/exceptions/:id/comments` | List comments |
| POST | `/web/escalation-rules` | Create escalation rule |
| GET | `/web/escalation-rules` | List rules |

#### Pattern to follow:
- `src/master-data/exception-management/` — existing module to extend

---

## PHASE 12: Work Orders

### Task: Create work order management module

#### New Prisma models:

```prisma
model WorkOrder {
  id              String    @id @default(uuid()) @db.Uuid
  tenantId        String    @map("tenant_id") @db.Uuid
  facilityId      String    @map("facility_id") @db.Uuid
  workOrderNumber String    @map("work_order_number") @db.VarChar(50)
  workOrderType   String    @map("work_order_type") @db.VarChar(50) // ASSEMBLY, DISASSEMBLY, KITTING, REPAIR, CUSTOM
  status          String    @default("DRAFT") @map("status") @db.VarChar(20) // DRAFT, RELEASED, IN_PROGRESS, COMPLETED, CANCELLED
  priority        String    @default("MEDIUM") @map("priority") @db.VarChar(10)
  productId       String?   @map("product_id") @db.Uuid
  quantity        Float?    @map("quantity") @db.Real
  uomId           String?   @map("uom_id") @db.Uuid
  clientId        String?   @map("client_id") @db.Uuid
  requestedByUserId String? @map("requested_by_user_id") @db.Uuid
  assignedToUserId String?  @map("assigned_to_user_id") @db.Uuid
  scheduledDate   DateTime? @map("scheduled_date") @db.Timestamptz
  startedAt       DateTime? @map("started_at") @db.Timestamptz
  completedAt     DateTime? @map("completed_at") @db.Timestamptz
  notes           String?   @map("notes") @db.Text
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  operations WorkOrderOperation[]
  components WorkOrderComponent[]

  @@unique([tenantId, facilityId, workOrderNumber], name: "work_orders_number_uq")
  @@index([tenantId, status], name: "idx_wo_status")
  @@schema("multitenant")
  @@map("work_orders")
}

model WorkOrderOperation {
  id              String     @id @default(uuid()) @db.Uuid
  tenantId        String     @map("tenant_id") @db.Uuid
  workOrderId     String     @map("work_order_id") @db.Uuid
  sequenceNumber  Int        @map("sequence_number")
  operationName   String     @map("operation_name") @db.VarChar(255)
  operationType   String     @map("operation_type") @db.VarChar(50) // TASK, QUALITY_CHECK, MOVE, LABEL
  assignedToUserId String?   @map("assigned_to_user_id") @db.Uuid
  estimatedMinutes Int?      @map("estimated_minutes")
  actualMinutes   Int?       @map("actual_minutes")
  status          String     @default("PENDING") @map("status") @db.VarChar(20)
  startedAt       DateTime?  @map("started_at") @db.Timestamptz
  completedAt     DateTime?  @map("completed_at") @db.Timestamptz
  notes           String?    @map("notes") @db.Text

  workOrder WorkOrder @relation(fields: [workOrderId], references: [id], onDelete: Cascade)

  @@index([tenantId, workOrderId, sequenceNumber], name: "idx_woo_order_seq")
  @@schema("multitenant")
  @@map("work_order_operations")
}

model WorkOrderComponent {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  workOrderId   String   @map("work_order_id") @db.Uuid
  productId     String   @map("product_id") @db.Uuid
  lotId         String?  @map("lot_id") @db.Uuid
  quantityRequired Float @map("quantity_required") @db.Real
  quantityConsumed Float @default(0) @map("quantity_consumed") @db.Real
  uomId         String   @map("uom_id") @db.Uuid
  notes         String?  @map("notes") @db.Text

  workOrder WorkOrder @relation(fields: [workOrderId], references: [id], onDelete: Cascade)

  @@index([tenantId, workOrderId], name: "idx_woc_order")
  @@schema("multitenant")
  @@map("work_order_components")
}
```

#### New module: `src/work-orders/`
- `work-orders.module.ts`
- `work-orders.service.ts` — CRUD + status lifecycle
- `operations.service.ts` — operation management
- `components.service.ts` — component BOM tracking
- `web/work-orders.controller.ts`
- `rf/work-orders.controller.ts`
- `dtos/`

#### API endpoints:
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/web/work-orders` | Create work order |
| GET | `/web/work-orders` | List (filterable) |
| GET | `/web/work-orders/:id` | Get with operations & components |
| PATCH | `/web/work-orders/:id` | Update |
| POST | `/web/work-orders/:id/release` | Release (DRAFT→RELEASED) |
| POST | `/web/work-orders/:id/complete` | Complete |
| POST | `/web/work-orders/:id/operations` | Add operation |
| PATCH | `/web/work-orders/:id/operations/:opId` | Update operation status |
| POST | `/web/work-orders/:id/components` | Add component requirement |
| POST | `/rf/work-orders/my-tasks` | RF: assigned work orders |
| POST | `/rf/work-orders/:id/start-operation` | RF: start operation |
| POST | `/rf/work-orders/:id/complete-operation` | RF: complete operation |

#### Pattern to follow:
- `src/outbound/vas-execution/` — similar task/operation lifecycle
- `src/outbound/picking.service.ts` — similar start/complete workflow

---

## PHASE 13: Event & Audit Infrastructure

### Task: Create warehouse event bus + system audit log

#### New Prisma models:

```prisma
model WarehouseEvent {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  facilityId    String?  @map("facility_id") @db.Uuid
  eventType     String   @map("event_type") @db.VarChar(100)
  entityType    String   @map("entity_type") @db.VarChar(50)
  entityId      String   @map("entity_id") @db.VarChar(100)
  eventData     Json?    @map("event_data") @db.Json
  source        String?  @map("source") @db.VarChar(50) // WEB, RF, INTEGRATION, SYSTEM
  performedByUserId String? @map("performed_by_user_id") @db.Uuid
  occurredAt    DateTime @default(now()) @map("occurred_at") @db.Timestamptz
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@index([tenantId, entityType, entityId], name: "idx_we_entity")
  @@index([tenantId, eventType, occurredAt], name: "idx_we_type_time")
  @@index([tenantId, facilityId, occurredAt], name: "idx_we_facility_time")
  @@schema("multitenant")
  @@map("warehouse_events")
}

model SystemAuditLog {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  facilityId    String?  @map("facility_id") @db.Uuid
  action        String   @map("action") @db.VarChar(100) // CREATE, UPDATE, DELETE, STATUS_CHANGE, LOGIN, EXPORT
  entityType    String   @map("entity_type") @db.VarChar(50)
  entityId      String   @map("entity_id") @db.VarChar(100)
  oldValue      Json?    @map("old_value") @db.Json
  newValue      Json?    @map("new_value") @db.Json
  changedByUserId String? @map("changed_by_user_id") @db.Uuid
  ipAddress     String?  @map("ip_address") @db.VarChar(50)
  userAgent     String?  @map("user_agent") @db.VarChar(500)
  occurredAt    DateTime @default(now()) @map("occurred_at") @db.Timestamptz
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@index([tenantId, entityType, entityId, occurredAt], name: "idx_sal_entity")
  @@index([tenantId, action, occurredAt], name: "idx_sal_action_time")
  @@index([tenantId, changedByUserId, occurredAt], name: "idx_sal_user_time")
  @@schema("multitenant")
  @@map("system_audit_logs")
}
```

#### New module: `src/observability/audit/` (or extend existing ObservabilityModule):
- `audit.service.ts` — write + query audit logs
- `warehouse-event.service.ts` — event publishing + querying
- Interceptor-based auto-auditing via `@AuditLog()` decorator

#### API endpoints:
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/web/audit-logs` | Query audit logs (filter by entityType, entityId, action, date range) |
| GET | `/web/events` | Query warehouse events (filter by eventType, entityType, entityId) |
| GET | `/web/events/:id` | Event detail |

#### Add `@AuditLog()` decorator:
- Can be applied to controller methods
- Automatically records action, entity, old/new values
- Pattern: `src/common/decorators/` for custom decorators

#### Pattern to follow:
- `src/common/interceptors/` — existing interceptor patterns
- `src/observability/` — existing module to contain this

---

## PHASE 14: Daily KPI & Analytics

### Task: Create daily KPI metrics + location pick heatmap

#### New Prisma models:

```prisma
model DailyKpiMetric {
  id                String   @id @default(uuid()) @db.Uuid
  tenantId          String   @map("tenant_id") @db.Uuid
  facilityId        String   @map("facility_id") @db.Uuid
  metricDate        DateTime @map("metric_date") @db.Date
  ordersCreated     Int      @default(0) @map("orders_created")
  ordersShipped     Int      @default(0) @map("orders_shipped")
  linesShipped      Int      @default(0) @map("lines_shipped")
  unitsShipped      Int      @default(0) @map("units_shipped")
  receiptsCreated   Int      @default(0) @map("receipts_created")
  receiptsCompleted Int      @default(0) @map("receipts_completed")
  putawaysCompleted Int      @default(0) @map("putaways_completed")
  picksCompleted    Int      @default(0) @map("picks_completed")
  packsCompleted    Int      @default(0) @map("packs_completed")
  shipmentsCreated  Int      @default(0) @map("shipments_created")
  shipmentsLoaded   Int      @default(0) @map("shipments_loaded")
  cycleCountsCompleted Int  @default(0) @map("cycle_counts_completed")
  adjustmentsCreated Int    @default(0) @map("adjustments_created")
  exceptionsCreated  Int    @default(0) @map("exceptions_created")
  exceptionsResolved Int    @default(0) @map("exceptions_resolved")
  activeUsers       Int     @default(0) @map("active_users")
  totalErrors       Int     @default(0) @map("total_errors")
  onHandValue       Decimal? @map("on_hand_value") @db.Decimal(16, 2)
  createdAt         DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime @updatedAt @map("updated_at") @db.Timestamptz

  @@unique([tenantId, facilityId, metricDate], name: "daily_kpi_metrics_uq")
  @@index([tenantId, facilityId, metricDate], name: "idx_dkm_date")
  @@schema("multitenant")
  @@map("daily_kpi_metrics")
}

model LocationPickHeatmap {
  id              String   @id @default(uuid()) @db.Uuid
  tenantId        String   @map("tenant_id") @db.Uuid
  facilityId      String   @map("facility_id") @db.Uuid
  locationId      String   @map("location_id") @db.Uuid
  metricDate      DateTime @map("metric_date") @db.Date
  pickCount       Int      @default(0) @map("pick_count")
  pickFrequency   String   @map("pick_frequency") @db.VarChar(10) // VERY_HIGH, HIGH, MEDIUM, LOW, VERY_LOW
  lastPickedAt    DateTime? @map("last_picked_at") @db.Timestamptz
  travelDistance  Float?   @map("travel_distance") @db.Real
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@unique([tenantId, facilityId, locationId, metricDate], name: "location_pick_heatmap_uq")
  @@index([tenantId, facilityId, metricDate, pickCount], name: "idx_lph_date_count")
  @@schema("multitenant")
  @@map("location_pick_heatmaps")
}
```

#### Extend `ReportsModule` or new `src/analytics/` module:
- `kpi.service.ts` — aggregate KPI data from various sources
- `heatmap.service.ts` — pick frequency analysis
- `web/analytics.controller.ts`

#### API endpoints:
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/web/analytics/kpi/daily` | Daily KPI (filter by date range) |
| GET | `/web/analytics/kpi/summary` | Aggregate summary |
| GET | `/web/analytics/heatmap/pick` | Pick heatmap data (filter by date, zone) |
| GET | `/web/analytics/heatmap/locations/top` | Top N pick locations |

#### Pattern to follow:
- `src/reports/` — existing report infrastructure
- `src/inventory/counts/` — summary/analytics endpoints

---

## PHASE 15: Fulfillment Workflow Events & Billing

**Why**: WmsStateMachine and WmsExecutionInstance exist. Add workflow events, transitions, and billing runs.

### Task: Create fulfillment workflow event/transition tracking + billing

#### New Prisma models:

```prisma
model FulfillmentWorkflowEvent {
  id              String   @id @default(uuid()) @db.Uuid
  tenantId        String   @map("tenant_id") @db.Uuid
  instanceId      String   @map("instance_id") @db.Uuid
  eventType       String   @map("event_type") @db.VarChar(100)
  eventPayload    Json?    @map("event_payload") @db.Json
  recordedBy      String?  @map("recorded_by") @db.Uuid
  recordedAt      DateTime @default(now()) @map("recorded_at") @db.Timestamptz
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@index([tenantId, instanceId], name: "idx_fwe_instance")
  @@schema("multitenant")
  @@map("fulfillment_workflow_events")
}

model FulfillmentWorkflowTransition {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  instanceId    String   @map("instance_id") @db.Uuid
  fromState     String?  @map("from_state") @db.VarChar(200)
  toState       String   @map("to_state") @db.VarChar(200)
  transition    String   @map("transition") @db.VarChar(100)
  context       Json?    @map("context") @db.Json
  triggeredBy   String?  @map("triggered_by") @db.VarChar(100)
  triggeredAt   DateTime @default(now()) @map("triggered_at") @db.Timestamptz
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@index([tenantId, instanceId], name: "idx_fwt_instance")
  @@schema("multitenant")
  @@map("fulfillment_workflow_transitions")
}

model FulfillmentBillingRun {
  id              String   @id @default(uuid()) @db.Uuid
  tenantId        String   @map("tenant_id") @db.Uuid
  facilityId      String   @map("facility_id") @db.Uuid
  runNumber       String   @map("run_number") @db.VarChar(50)
  runType         String   @map("run_type") @db.VarChar(30) // ORDER_FULFILLMENT, STORAGE, VAS
  periodStart     DateTime @map("period_start") @db.Date
  periodEnd       DateTime @map("period_end") @db.Date
  totalTransactions Int   @default(0) @map("total_transactions")
  totalAmount     Decimal  @default(0) @map("total_amount") @db.Decimal(14, 2)
  status          String   @default("PENDING") @map("status") @db.VarChar(20)
  executedAt      DateTime? @map("executed_at") @db.Timestamptz
  errorDetails    String?  @map("error_details") @db.Text
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamptz

  events FulfillmentBillingEvent[]

  @@unique([tenantId, runNumber], name: "fulfillment_billing_runs_number_uq")
  @@schema("multitenant")
  @@map("fulfillment_billing_runs")
}

model FulfillmentBillingEvent {
  id            String                 @id @default(uuid()) @db.Uuid
  tenantId      String                 @map("tenant_id") @db.Uuid
  runId         String                 @map("run_id") @db.Uuid
  entityType    String                 @map("entity_type") @db.VarChar(50) // ORDER, LINE, SHIPMENT
  entityId      String                 @map("entity_id") @db.VarChar(100)
  eventType     String                 @map("event_type") @db.VarChar(50)
  quantity      Float?                 @map("quantity") @db.Real
  unitPrice     Decimal?               @map("unit_price") @db.Decimal(12, 4)
  lineTotal     Decimal?               @map("line_total") @db.Decimal(14, 2)
  eventDate     DateTime               @default(now()) @map("event_date") @db.Timestamptz
  createdAt     DateTime               @default(now()) @map("created_at") @db.Timestamptz

  run FulfillmentBillingRun @relation(fields: [runId], references: [id], onDelete: Cascade)

  @@index([tenantId, runId], name: "idx_fbe_run")
  @@schema("multitenant")
  @@map("fulfillment_billing_events")
}
```

#### Extend `CustomizationModule` (`src/customization/`):
- Add workflow event/transition recording
- Wire into state machine execution lifecycle

#### New submodule: `src/customization/billing/`
- `fulfillment-billing.service.ts` — billing run lifecycle
- Wire into order/shipment completed events

#### API endpoints:
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/web/workflows/instances/:id/events` | Workflow event timeline |
| GET | `/web/workflows/instances/:id/transitions` | Transition history |
| POST | `/web/fulfillment-billing/runs` | Create billing run |
| GET | `/web/fulfillment-billing/runs` | List billing runs |
| GET | `/web/fulfillment-billing/runs/:id` | Run detail with events |

#### Pattern to follow:
- `src/outbound/vas-execution/` — task events pattern
- `src/customization/` — existing engine to extend

---

## DUPLICATION CHECK — Areas Already Covered

| Feature | Existing Module(s) | Status | This Plan |
|---------|-------------------|--------|-----------|
| Exception Management | `ExceptionManagementModule` | Complete | Phase 11: comments + escalation only |
| Loading Docks | `LoadingDocksModule` | Complete | Phase 8: appointments + yard only |
| Non-Conformance | `NonConformanceReportsModule` | Partial (no RF) | Phase 5: add RF controller + link to inspections |
| VAS Execution | `VasExecutionModule` | Complete | Phase 6: catalog + rates only (separate module) |
| Carrier Rates | `CarrierRateShoppingModule` | Complete | Not duplicated — leave as-is |
| Packing Stations | `PackingStationsModule` | Partial (no workflow) | Phase 3: pack workflow integration |
| Replenishment | `ReplenishmentModule` | Complete | Not duplicated — leave as-is |
| Cycle Counting | `CycleCountModule` | Complete | Phase 4: metrics + accuracy history only |
| Approvals | `ApprovalsModule` | Complete | Not duplicated (already integrated with cycle counts) |
| Product-Client | `ProductClientAssignmentsModule` | Complete | Not duplicated |
| Hierarchy | `HierarchyModule` | Complete | Not duplicated |
| Inventory Transactions | `InventoryTransactionService` | Complete | Not duplicated |
| Inventory Lots | `InventoryLotService` | Complete | Not duplicated |
| Putaway Tasks | `PutawayTask` model + inbound PUTAWAY flow | Complete | Not duplicated |
| Picking Waves/Tasks | `WaveService` + `PickingService` + `AllocationService` | Complete | Not duplicated |
| Packing Sessions | `PackingSession` + `PackingContainer` models | Schema exists, no workflow | Phase 3 |
| Outbound Shipments | `OutboundShipment` model + `ShippingService` | Complete | Shipment status history only (Phase 3) |
| Integration Gateway | `IntegrationsModule` + models | Complete | Not duplicated |
| State Machines/Rules | `CustomizationModule` + models | Complete | Phase 15: events + transitions only |

---

## EXECUTION ORDER SUMMARY

| Phase | Module | Models Added | New APIs | Dependencies |
|-------|--------|-------------|----------|-------------|
| 0 | Schema Enhancements | 0 models, column changes only | 0 | None |
| 1 | Master Data: Customers | 2 | ~10 | Phase 0 |
| 2 | Inventory: Allocation Rules | 3 | ~10 | Phase 0 |
| 3 | Outbound: Packing Workflow | 2 | ~12 | Phase 0 |
| 4 | Inventory: LPN Audit + Count Metrics | 3 | ~6 | Phase 0 |
| 5 | Quality: Inspections + Compliance | 7 | ~16 | Phase 0 |
| 6 | VAS: Service Catalog | 3 | ~8 | Phase 0 |
| 7 | Storage Billing Engine | 7 | ~14 | Phase 1 (Client) |
| 8 | Dock & Yard | 2 | ~10 | Phase 0 |
| 9 | Labor Management | 4 | ~12 | Phase 0 |
| 10 | Equipment Management | 2 | ~10 | Phase 0 |
| 11 | Exception Enhancement | 2 | ~4 | Phase 0 |
| 12 | Work Orders | 3 | ~14 | Phase 0 |
| 13 | Event & Audit Infrastructure | 2 | ~3 | Phase 0 |
| 14 | KPI & Analytics | 2 | ~4 | Phase 0, 3, 4, 9 |
| 15 | Fulfillment Workflow | 4 | ~6 | Phase 0 |

**Total new models**: ~46  
**Total new API endpoints**: ~139  
**Existing modules extended**: 8  
**Duplications avoided**: 12 features already covered by existing modules
