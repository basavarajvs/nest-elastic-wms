# Phase 16 — Manhattan WMS Enhancements

**Goal:** Fill operational gaps identified during P03/P04 deep audit against Manhattan WMS behavior patterns. These gaps are not covered by any existing phase (P5–P15).

**Depends on:** P3 (Inventory), P4 (Outbound) — all existing services and endpoints are in place

---

## Tier 1 — Must-Fix (critical operational gaps)

### 1. RF Replenishment Confirmation

**Why:** In Manhattan, replenishment (bulk → pick face) is confirmed via RF scanner. Currently only web can complete/cancel replenishment tasks.

**Changes needed:**

**RF Controller — `src/inventory/replenishment/rf/replenishment.controller.ts`** (new file)

| Route | Method | Action | Purpose |
|-------|--------|--------|---------|
| `POST /rf/replenishment/next` | RfAction('read') | Get next assigned replenishment task | Returns task with from/to locations, product, qty |
| `POST /rf/replenishment/confirm` | RfAction('update') | Confirm replenishment completion | Calls ReplenishmentService.completeTask |
| `POST /rf/replenishment/scan-location` | RfAction('update') | Verify scanned from-location | Validates location matches task |
| `POST /rf/replenishment/scan-product` | RfAction('update') | Verify scanned product | Validates product barcode matches task |

**Service method to add** (or reuse existing):
- `ReplenishmentService.getNextTask(tenantId, userId)` — returns next unassigned/assigned task
- `ReplenishmentService.scanLocation(taskId, locationId, tenantId)` — validates location
- `ReplenishmentService.scanProduct(taskId, productId, tenantId)` — validates product

**Module wiring:**
- Create `src/inventory/replenishment/rf/replenishment.module.ts` or register controller in existing module
- Apply `RfSessionGuard` + `RfActionLightweightGuard`

**CASL:** Reuse existing `'Replenishment'` subject

---

### 2. RF Hold Management

**Why:** In Manhattan, pickers can place/release holds on-the-fly from RF (e.g., spotting damage during picking). Currently holds are web-only.

**Changes needed:**

**RF Controller — add to `src/inventory/rf/inventory.controller.ts`**

| Route | Method | Action | Purpose |
|-------|--------|--------|---------|
| `POST /rf/inventory/holds/place` | RfAction('create') | Place a hold on a lot/LPN | Calls InventoryHoldService.createHold |
| `POST /rf/inventory/holds/:id/release` | RfAction('update') | Release a hold | Calls InventoryHoldService.releaseHold |
| `GET /rf/inventory/holds/:lotId` | RfAction('read') | Check holds on a lot | Calls InventoryHoldService.checkHoldsForLot |

**Service reuse:** All three methods already exist on `InventoryHoldService`:
- `createHold(dto, tenantId, userId)`
- `releaseHold(holdId, dto, tenantId, userId)`
- `checkHoldsForLot(tenantId, lotId)`

---

### 3. Web Picking Task Detail

**Why:** Supervisors need to drill into a single picking task from the web. Currently only list and assign are available.

**Changes needed:**

**Controller — add to `src/outbound/web/outbound.controller.ts`**

| Route | Method | Path |
|-------|--------|------|
| `GET` | `/web/outbound/picking-tasks/:id` | Returns full task detail with order info, product, location, picker |

**Service:** Add `PickingService.getTaskById(taskId, tenantId)` or reuse existing `findFirst` pattern. Should include related order line, product, location, and assigned user.

---

### 4. Wave Detail Includes Tasks/Orders

**Why:** `WaveService.findById` currently returns only the wave header. Manhattan wave view shows contents (orders, tasks, progress).

**Changes needed:**

**Service — update `src/outbound/wave.service.ts`**

Modify `findById(waveId, tenantId)` to include:
- Tasks count (by status: CREATED, ASSIGNED, IN_PROGRESS, COMPLETED, SHORT)
- Orders count
- Total/completed task counts (already stored on wave, but should be in response)
- Tasks summary (taskNumber, locationId, productId, status, assignedToUserId)

**Break nothing:** Return the current flat object plus a `summary` nested object with counts and optionally a `tasks` array.

---

### 5. Web Picking Task Complete/Cancel

**Why:** Supervisors need to manually complete or cancel picking tasks from the web (e.g., when a task is stuck or needs exception handling). Currently only RF can complete.

**Changes needed:**

**Controller — add to `src/outbound/web/outbound.controller.ts`**

| Route | Method | Path | Purpose |
|-------|--------|------|---------|
| `POST` | `/web/outbound/picking-tasks/:id/complete` | Complete a task (with fulfilled qty) |
| `PATCH` | `/web/outbound/picking-tasks/:id/cancel` | Cancel a task (with reason) |

**Service — add to `PickingService`:**
- `completeTask(taskId, fulfilledQty, userId, tenantId)` — similar to confirmPick but from web context
- `cancelTask(taskId, reason, tenantId)` — sets status to CANCELLED, frees up inventory

**Note:** `completeTask` should be a simplified version of `confirmPick` that doesn't require location/product scanning (supervisor override).

---

## Tier 2 — Should-Have (meaningful enhancements)

### 6. Web Create Inventory Transaction

**Why:** Currently only RF can create inventory transactions (putaway, pick, receipt, transfer). Supervisors need web access for manual entry.

**Changes needed:**

**Controller — add to `src/inventory/web/transaction.controller.ts`**

| Route | Method | Path | Purpose |
|-------|--------|------|---------|
| `POST` | `/web/inventory/transactions` | Create a manual transaction |

**Service reuse:** `InventoryTransactionService.executeTransaction(dto, tenantId)` already exists and handles all transaction types (RECEIPT, PUTAWAY, PICK, PACK, SHIP, ADJUSTMENT_INCREASE, ADJUSTMENT_DECREASE, TRANSFER_IN, TRANSFER_OUT).

**DTO reuse:** `CreateTransactionDto` already exists at `src/inventory/dtos/transaction.dto.ts`.

---

### 7. RF Quick Stock Transfer

**Why:** Manhattan RF supports quick stock movement between locations (not LPN-based). Currently RF has putaway and pick but no generic "move stock" transaction.

**Changes needed:**

**RF Controller — add to `src/inventory/rf/inventory.controller.ts`**

| Route | Method | Action | Purpose |
|-------|--------|--------|---------|
| `POST /rf/inventory/transfer` | RfAction('create') | Quick stock transfer between locations |

**Service reuse:** `InventoryTransactionService.executeTransaction(dto, tenantId)` with `transactionType: 'TRANSFER_IN'` or `'TRANSFER_OUT'` and appropriate `locationId` / `locationIdTo` fields.

Alternatively, a dedicated `InventoryOnHandService.transferStock(fromLocationId, toLocationId, productId, lotId, quantity, tenantId)` method that handles both decrement from source and increment to destination in a single transaction.

---

### 8. Order Allocation View

**Why:** No dedicated endpoint to view allocation status for a specific order. Manhattan web shows allocation details per order.

**Changes needed:**

**Controller — add to `src/outbound/web/outbound.controller.ts`**

| Route | Method | Path | Purpose |
|-------|--------|------|---------|
| `GET` | `/web/outbound/orders/:id/allocations` | Returns all allocations for an order's lines |

**Service reuse:** `AllocationService` has methods like `getPendingSoftAllocations` but no dedicated `findByOrderId`. Add `AllocationService.findByOrderId(orderId, tenantId)` that queries `inventory_allocations` joined to order lines.

---

## Tier 3 — Nice-to-Have (enhancements beyond plan scope)

### 9. Structured Shortage/Damage Reason Codes

**Why:** `confirmPick` accepts free-text `exceptionNotes` but Manhattan uses structured reason codes (DAMAGE, SHORT, PICK_ERROR, WRONG_PRODUCT, etc.).

**Changes needed:**

**Enum/Constant:**
```typescript
enum PickExceptionReason {
  DAMAGE = 'DAMAGE',
  SHORT = 'SHORT',
  PICK_ERROR = 'PICK_ERROR',
  WRONG_PRODUCT = 'WRONG_PRODUCT',
  LABEL_DAMAGE = 'LABEL_DAMAGE',
  PACKAGING_ISSUE = 'PACKAGING_ISSUE',
  OTHER = 'OTHER',
}
```

**DTO update:** Add `exceptionReason?: PickExceptionReason` to `ConfirmPickDto`.

**Service update:** In `PickingService.confirmPick`, when creating a SHORT or BACKORDERED line, write the structured reason code to the picking task and optionally trigger exception management (P8) or quality hold (P5).

---

### 10. Inventory Aging Report

**Why:** Manhattan provides days-on-hand analysis to identify stale inventory, obsolescence risk, and slow-moving stock.

**Changes needed:**

**Web Endpoint:**

| Route | Method | Path | Purpose |
|-------|--------|------|---------|
| `GET` | `/web/inventory/aging` | Inventory aging report (filterable by facility, product, date range) |

**Service — add to `InventoryOnHandService`:**
```typescript
getAgingReport(tenantId: string, filters: {
  facilityId?: string;
  productId?: string;
  daysMin?: number;
  daysMax?: number;
  page?: number;
  limit?: number;
}): Promise<{ data: AgingBucket[]; total: number }>
```

Groups inventory by lot age buckets (0-30, 31-60, 61-90, 91-180, 180+ days) using `lot.createdAt` relative to current date.

**Aggregation endpoint:**
| Route | Method | Path | Purpose |
|-------|--------|------|---------|
| `GET` | `/web/inventory/aging/summary` | Aggregated aging totals per facility | Returns total qty and value per age bucket |

---

### 11. ABC Classification Management

**Why:** Cycle count service references `ABC_CLASS` as a scope type but there's no endpoint to view or set ABC classification. Manhattan uses ABC analysis extensively for cycle counting frequency and slotting optimization.

**Changes needed:**

**Model considerations:**
- Option A: Add `abcClass` field to `inventory_policies` or `products` table
- Option B: Create a new `product_abc_classifications` table
- Option C: Store as JSON attribute on existing product or policy record

**Endpoints (assuming Option A — field on policies):**

| Route | Method | Path | Purpose |
|-------|--------|------|---------|
| `GET` | `/web/inventory/abc-classification` | List ABC classifications (filterable) |
| `PATCH` | `/web/inventory/abc-classification/:productId` | Set ABC class for a product |

**Service:** Add `InventoryPolicyService` methods or create a new `AbcClassificationService`:
- `getClassifications(tenantId, facilityId)` — returns product → ABC class mapping
- `setClassification(productId, abcClass, tenantId)` — updates policy or product attribute

---

## Summary of Changes

| # | Gap | File Changes | New/Modified | Service Reuse |
|---|-----|-------------|--------------|---------------|
| 1 | RF replenishment | `src/inventory/replenishment/rf/` | New controller | ReplenishmentService |
| 2 | RF hold mgmt | `src/inventory/rf/inventory.controller.ts` | Add routes | InventoryHoldService |
| 3 | Pick task detail | `src/outbound/web/outbound.controller.ts` + `picking.service.ts` | Add route + method | — |
| 4 | Wave detail | `src/outbound/wave.service.ts` | Modify findById | — |
| 5 | Pick complete/cancel | `src/outbound/web/outbound.controller.ts` + `picking.service.ts` | Add routes + methods | — |
| 6 | Web create txn | `src/inventory/web/transaction.controller.ts` | Add route | InventoryTransactionService |
| 7 | RF quick transfer | `src/inventory/rf/inventory.controller.ts` + `onhand.service.ts` | Add route + method | — |
| 8 | Order allocation view | `src/outbound/web/outbound.controller.ts` + `allocation.service.ts` | Add route + method | — |
| 9 | Reason codes | `src/outbound/dtos/picking.dto.ts` + `picking.service.ts` | Modify DTO + logic | — |
| 10 | Inventory aging | New controller or add to inventory web | New route + service | InventoryOnHandService |
| 11 | ABC classification | New controller or add to policies | New routes + service | InventoryPolicyService |

## Tests

| Test | Coverage |
|------|----------|
| RF replenishment next + confirm + scan | `inventory/replenishment/rf/replenishment.service.spec.ts` |
| RF hold place/release from RF | Combined with existing hold service tests |
| Picking task detail query | `outbound/picking.service.spec.ts` |
| Wave detail with tasks summary | `outbound/wave.service.spec.ts` |
| Pick task complete/cancel from web | `outbound/picking.service.spec.ts` |
| Web transaction creation | `inventory/inventory-transaction.service.spec.ts` |
| Quick stock transfer | `inventory/inventory-onhand.service.spec.ts` |
| Order allocation query | `outbound/allocation.service.spec.ts` |
| Shortage/damage reason codes | `outbound/picking.service.spec.ts` |
| Inventory aging report | `inventory/inventory-onhand.service.spec.ts` |
| ABC classification CRUD | New `inventory/abc-classification.service.spec.ts` |
