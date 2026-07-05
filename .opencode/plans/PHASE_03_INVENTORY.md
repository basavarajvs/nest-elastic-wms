# Phase 3 — Inventory Core + Approvals

**Goal:** On-hand tracking, LPN management, lots, adjustments, cycle counts, allocations, holds, variance investigation, approval workflow.

**Depends on:** P0, P1 (products, locations, facilities)

---

## Models (22 existing, 2 new tables)

### Existing Tables in DB

| # | Schema Model | Table Name | Module |
|---|-------------|------------|--------|
| 1 | inventory_items | `inventory_items` | inventory/items |
| 2 | inventory_on_hand | `inventory_on_hand` | inventory/on-hand |
| 3 | license_plate_numbers | `license_plate_numbers` | inventory/lpn |
| 4 | lpn_transactions | `lpn_transactions` | inventory/lpn |
| 5 | inventory_lots | `inventory_lots` | inventory/lots |
| 6 | inventory_transactions | `inventory_transactions` | inventory/transactions |
| 7 | inventory_holds | `inventory_holds` | inventory/holds |
| 8 | inventory_adjustments | `inventory_adjustments` | inventory/adjustments |
| 9 | inventory_adjustment_lines | `inventory_adjustment_lines` | inventory/adjustments |
| 10 | inventory_counts | `inventory_counts` | inventory/counts |
| 11 | inventory_count_lines | `inventory_count_lines` | inventory/counts |
| 12 | cycle_count_metrics | `cycle_count_metrics` | inventory/counts |
| 13 | count_accuracy_history | `count_accuracy_history` | inventory/counts |
| 14 | inventory_allocations | `inventory_allocations` | inventory/allocations |
| 15 | inventory_reservations | `inventory_reservations` | inventory/allocations |
| 16 | inventory_allocation_rules | `inventory_allocation_rules` | inventory/allocations |
| 17 | inventory_allocation_rule_constraints | `inventory_allocation_rule_constraints` | inventory/allocations |
| 18 | inventory_allocation_rule_locations | `inventory_allocation_rule_locations` | inventory/allocations |
| 19 | inventory_policies | `inventory_policies` | inventory/policies |
| 20 | variance_investigations | `variance_investigations` | inventory/adjustments |
| 21 | adjustment_approval_requests | `adjustment_approval_requests` | inventory/approvals |
| 22 | billing_cycles | `billing_cycles` | inventory (referenced later by P12) |

### New Tables to CREATE

| # | Model | Table | Fields | Key Indexes |
|---|-------|-------|--------|-------------|
| 1 | ApprovalThresholdConfig | `approval_threshold_configs` | id(UUID), tenantId(UUID), version(VARCHAR20), autoThreshold(FLOAT), supervisorThreshold(FLOAT), managerThreshold(FLOAT), active(BOOL), appliedAt(TIMESTAMPTZ), createdAt(TIMESTAMPTZ) | `threshold_config_uq(tenantId,version)`, `idx_threshold_active(tenantId,active)` |
| 2 | CountSchedulerMetric | `count_scheduler_metrics` | id(UUID), tenantId(UUID), runId(VARCHAR100), generatedAt(TIMESTAMPTZ), durationMs(INT), totalGenerated(INT), successRate(DECIMAL5,2), failedProductCodes(JSON), createdAt(TIMESTAMPTZ) | `idx_csm_run(tenantId,runId)` |

**Migration SQL:**
```sql
CREATE TABLE multitenant.approval_threshold_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  version VARCHAR(20) NOT NULL,
  auto_threshold FLOAT NOT NULL,
  supervisor_threshold FLOAT NOT NULL,
  manager_threshold FLOAT NOT NULL,
  active BOOLEAN DEFAULT true,
  applied_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, version)
);
CREATE INDEX idx_threshold_active ON multitenant.approval_threshold_configs(tenant_id, active);

CREATE TABLE multitenant.count_scheduler_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  run_id VARCHAR(100) NOT NULL,
  generated_at TIMESTAMPTZ,
  duration_ms INTEGER,
  total_generated INTEGER,
  success_rate DECIMAL(5,2),
  failed_product_codes JSON,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_csm_run ON multitenant.count_scheduler_metrics(tenant_id, run_id);
```

---

## Module Structure

```
src/inventory/
├── inventory.module.ts
├── items/                    # inventory_items
├── on-hand/                  # inventory_on_hand
├── lpn/                      # license_plate_numbers, lpn_transactions
├── lots/                     # inventory_lots
├── transactions/             # inventory_transactions
├── holds/                    # inventory_holds
├── adjustments/              # inventory_adjustments + lines + variance_investigations
├── counts/                   # inventory_counts + lines + metrics + accuracy
├── allocations/              # allocations + reservations + rules + constraints + locations
├── policies/                 # inventory_policies
├── approvals/                # adjustment_approval_requests + threshold_configs
│   ├── adjustment-approval.service.ts
│   ├── auto-approval.processor.ts
│   └── web/approvals.controller.ts
├── web/
├── rf/
└── dtos/
```

---

## Web Endpoints

| Domain | Method | Path | CASL Subject |
|--------|--------|------|-------------|
| On-Hand | GET | `/web/inventory/on-hand` (filterable) | InventoryOnHand |
| On-Hand | GET | `/web/inventory/on-hand/:id` | InventoryOnHand |
| LPN | POST/GET/PATCH | `/web/lpns[/:id]` | LPN |
| LPN | POST | `/web/lpns/barcode/:code` | LPN |
| LPN | GET | `/web/lpns/:id/transactions` | LPN |
| Lots | POST/GET/PATCH | `/web/inventory-lots[/:id]` | InventoryLot |
| Transactions | GET | `/web/inventory-transactions` (filterable) | InventoryTransaction |
| Holds | POST/GET/PATCH | `/web/inventory-holds[/:id]` | InventoryHold |
| Holds | POST | `/web/inventory-holds/:id/release` | InventoryHold |
| Adjustments | POST/GET | `/web/inventory-adjustments[/:id]` | InventoryAdjustment |
| Adjustments | POST | `/web/inventory-adjustments/:id/approve` | InventoryAdjustment |
| Cycle Counts | POST/GET/PATCH | `/web/cycle-counts[/:id]` | CycleCount |
| Cycle Counts | POST | `/web/cycle-counts/:id/submit-line` | CycleCount |
| Cycle Counts | POST | `/web/cycle-counts/:id/complete` | CycleCount |
| Allocations | POST/GET | `/web/inventory-allocations` | InventoryAllocation |
| Allocation Rules | POST/GET/PATCH | `/web/allocation-rules[/:id]` | InventoryAllocation |
| Approvals | GET | `/web/approvals/pending` | AdjustmentApproval |
| Approvals | POST | `/web/approvals/:id/approve` | AdjustmentApproval |
| Approvals | POST | `/web/approvals/:id/reject` | AdjustmentApproval |
| Threshold Configs | POST/GET/PATCH | `/web/approval-thresholds[/:id]` | ApprovalThresholdConfig |

## RF Endpoints

| Route | Action | Purpose |
|-------|--------|---------|
| `POST /rf/cycle-counts/start` | executeCycleCount | Begin cycle count session |
| `POST /rf/cycle-counts/scan-location` | executeCycleCount | Scan location barcode |
| `POST /rf/cycle-counts/enter-qty` | executeCycleCount | Enter counted quantity |
| `POST /rf/cycle-counts/submit-line` | executeCycleCount | Submit count line |
| `POST /rf/cycle-counts/complete` | executeCycleCount | Complete count session |
| `POST /rf/lpn/lookup` | lookup | Scan LPN barcode |
| `POST /rf/lpn/move` | transact | Move LPN to new location |

## BullMQ Queues

- `auto-approval-processor` — batch auto-approves pending adjustments below threshold

## CASL Subjects to Add

`'InventoryOnHand' | 'LPN' | 'InventoryLot' | 'InventoryTransaction' | 'InventoryHold' | 'InventoryAdjustment' | 'CycleCount' | 'CycleCountLine' | 'InventoryAllocation' | 'AdjustmentApproval' | 'ApprovalThresholdConfig'`

## Tenant Isolation — Add to `hasTenantId()`

All 22 existing + 2 new models.

## Key Business Logic

### Approval Workflow
1. Cycle count variance triggers `AdjustmentApproval` creation
2. System compares variance value against `ApprovalThresholdConfig`:
   - Below `autoThreshold` → AUTO_APPROVED, queued for batch approval
   - Below `supervisorThreshold` → SUPERVISOR level, manual approval required
   - Below `managerThreshold` → MANAGER level
   - Above → DIRECTOR level
3. `AutoApprovalProcessor` (BullMQ) runs every minute, auto-approves AUTO_APPROVED items
4. Manual approve/reject via web controller with `@CheckAbility`

### FIFO Lot Allocation
- `InventoryLot` tracks received date + expiry
- Allocation engine picks lots by FIFO (oldest received first, closest expiry first)
- `InventoryAllocationRule` + `InventoryAllocationRuleConstraint` define allocation strategies

## Tests

| Test | File |
|------|------|
| OnHandService queries | `inventory/on-hand/on-hand.service.spec.ts` |
| LPN lifecycle (create→store→pick) | `inventory/lpn/lpn.service.spec.ts` |
| Adjustment creation + approval routing | `inventory/adjustments/adjustment.service.spec.ts` |
| Cycle count workflow | `inventory/counts/cycle-count.service.spec.ts` |
| Approval workflow (auto + manual) | `inventory/approvals/adjustment-approval.service.spec.ts` |
| FIFO lot allocation | `inventory/allocations/allocation.service.spec.ts` |
